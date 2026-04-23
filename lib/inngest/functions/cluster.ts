import { NonRetriableError } from 'inngest'
import { inngest } from '../client'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { db } from '@/lib/db'
import { questionnaireResponses, personas, jobs } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { kmeanspp } from '@/lib/clustering/kmeans'
import { DIMENSIONS } from '@/lib/vcpq/vector'

interface ClusterEventData {
  jobId: string
  companyId: string
  questionnaireId: string
  k: number
}

interface PersonaProfile {
  name: string
  tagline: string
  summary: {
    overview: string
    strengths: string[]
    growthAreas: string[]
  }
  systemPrompt: string
}

export const clusterFn = inngest.createFunction(
  {
    id: 'cluster-personas',
    triggers: [{ event: 'persona/cluster.requested' }],
    onFailure: async ({ event }) => {
      const { jobId, companyId } = event.data.event.data as { jobId: string; companyId: string }
      await db
        .update(jobs)
        .set({ status: 'failed', error: 'Job exceeded retry limit', updatedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    },
  },
  async ({ event, step }) => {
    const data = event.data as unknown as ClusterEventData

    // Step 1: validate payload — NonRetriableError skips Inngest retries
    await step.run('validate-payload', async () => {
      if (
        typeof data.jobId !== 'string' ||
        typeof data.companyId !== 'string' ||
        typeof data.questionnaireId !== 'string'
      ) {
        throw new NonRetriableError('invalid payload: jobId, companyId, questionnaireId must be strings')
      }
      if (typeof data.k !== 'number' || data.k < 1 || data.k > 10) {
        throw new NonRetriableError('invalid payload: k must be a number between 1 and 10')
      }
    })

    const { jobId, companyId, questionnaireId, k } = data

    // Step 2: mark job running
    await step.run('mark-running', async () => {
      await db
        .update(jobs)
        .set({ status: 'running', updatedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    })

    // Step 3: load completed response vectors, scoped to this questionnaire
    const rows = await step.run('load-vectors', async () => {
      const results = await db
        .select({
          id: questionnaireResponses.id,
          vector: questionnaireResponses.personalityVector,
        })
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.questionnaireId, questionnaireId),
            isNotNull(questionnaireResponses.personalityVector),
          ),
        )

      if (results.length < 3) {
        throw new NonRetriableError('Need at least 3 responses to cluster')
      }

      return results as { id: string; vector: number[] }[]
    })

    // Step 4: run k-means++ — pure CPU work, no I/O
    const clusters = await step.run('run-kmeans', async () => {
      const vectors = rows.map((r) => r.vector)
      return kmeanspp(vectors, k)
    })

    // Step 5: per-cluster persona generation — each runs as its own Inngest step
    // so individual failures are retried without re-running the others
    const personaIds = await Promise.all(
      clusters.map((cluster, i) =>
        step.run(`generate-persona-${i}`, async () => {
          // Create groq client inside the step so env is available at runtime
          const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

          const { centroid, memberIndices } = cluster
          const clusterSize = memberIndices.length

          const dimensionLines = DIMENSIONS.map((d, idx) => `  ${d}: ${centroid[idx].toFixed(2)}`).join('\n')

          const prompt = `You are building personality personas for a workplace tool. Based on this cluster data, generate a professional persona profile.

Cluster ${i + 1} of ${k}: ${clusterSize} employees
Centroid personality dimensions (scale -1 to 1):
${dimensionLines}

Respond with ONLY valid JSON (no markdown):
{
  "name": "A descriptive persona name (e.g. 'The Analytical Architect')",
  "tagline": "One sentence describing this persona type (max 100 chars)",
  "summary": {
    "overview": "2-3 sentence overview of this persona",
    "strengths": ["strength1", "strength2", "strength3"],
    "growthAreas": ["area1", "area2"]
  },
  "systemPrompt": "You are [persona name]. [2-3 sentences of in-character behavioral guidance for an AI to embody this persona in workplace conversations. Focus on communication style, decision-making approach, and interpersonal tendencies.]"
}`

          // generateText throws on failure — let Inngest retry handle it
          const { text } = await generateText({
            model: groq(process.env.GROQ_MODEL!),
            prompt,
            maxOutputTokens: 800,
          })

          const profile: PersonaProfile = JSON.parse(text)

          const inserted = await db
            .insert(personas)
            .values({
              companyId,
              questionnaireId,
              name: profile.name,
              tagline: profile.tagline,
              status: 'active',
              summary: profile.summary,
              systemPrompt: profile.systemPrompt,
              // Drizzle custom type handles number[] → pgvector serialization
              personalityVector: centroid,
              clusterSize,
              clusterId: i,
              generatedAt: new Date(),
              updatedAt: new Date(),
            })
            .returning({ id: personas.id })

          return inserted[0].id
        }),
      ),
    )

    // Step 6: mark job complete
    await step.run('mark-complete', async () => {
      await db
        .update(jobs)
        .set({ status: 'complete', updatedAt: new Date(), completedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    })

    return { jobId, personaIds, clusterCount: clusters.length }
  },
)
