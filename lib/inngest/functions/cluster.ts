import { NonRetriableError } from 'inngest'
import { inngest } from '../client'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { db } from '@/lib/db'
import { questionnaireResponses, personas, jobs } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { kmeanspp, optimalK } from '@/lib/clustering/kmeans'
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
      // k=0 means auto-detect optimal k via silhouette score
      if (typeof data.k !== 'number' || data.k < 0 || data.k > 10) {
        throw new NonRetriableError('invalid payload: k must be 0 (auto) or 1–10')
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
          demographics: questionnaireResponses.demographics,
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

      return results as { id: string; vector: number[]; demographics: Record<string, string> | null }[]
    })

    // Step 4: run k-means++ — pure CPU work, no I/O
    // k=0 means auto: silhouette score selects the best k in [3, min(10, n/2)]
    const clusters = await step.run('run-kmeans', async () => {
      const vectors = rows.map((r) => r.vector)
      const chosenK = k === 0 ? optimalK(vectors, 3, 10) : k
      return kmeanspp(vectors, chosenK)
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

          // Aggregate demographic modes for this cluster
          const clusterDemos = memberIndices
            .map((idx) => rows[idx].demographics ?? {})
          const demoFields = ['age', 'relationship', 'children', 'tenure', 'work_style', 'level']
          const demoSummary: Record<string, string> = {}
          for (const field of demoFields) {
            const counts: Record<string, number> = {}
            for (const d of clusterDemos) {
              const v = d[field]
              if (v) counts[v] = (counts[v] ?? 0) + 1
            }
            const entries = Object.entries(counts)
            if (entries.length > 0) {
              demoSummary[field] = entries.sort((a, b) => b[1] - a[1])[0][0]
            }
          }
          const hasDemos = Object.keys(demoSummary).length > 0
          const demoLines = hasDemos
            ? Object.entries(demoSummary)
                .map(([k, v]) => `  ${k}: ${v}`)
                .join('\n')
            : ''

          const chosenK = clusters.length
          const prompt = `You are building personality personas for a workplace tool. Based on this cluster data, generate a rich, vivid persona profile that feels like a real person.

Cluster ${i + 1} of ${chosenK}: ${clusterSize} employees
Personality dimensions (scale -1 to 1):
${dimensionLines}
${hasDemos ? `\nTypical demographic profile (most common values in cluster):\n${demoLines}` : ''}

Generate a persona that feels like a real person. Use the demographics to add specific life context (e.g. "married with two kids", "early career", "remote worker"). Age and life stage should inform the persona's priorities and communication style.

Respond with ONLY valid JSON (no markdown):
{
  "name": "A descriptive persona name (e.g. 'The Analytical Architect')",
  "tagline": "One sentence describing this persona type (max 100 chars)",
  "demographics": {
    "age": "approximate age or range based on data",
    "relationship_status": "single/married/etc or 'not specified'",
    "children": "number or 'none' or 'not specified'",
    "tenure": "years at company",
    "work_style": "remote/hybrid/in-office or 'not specified'",
    "level": "seniority level"
  },
  "summary": {
    "overview": "2-3 sentences describing this persona as a real person — include their life stage, work style, and what drives them",
    "strengths": ["strength1", "strength2", "strength3"],
    "growthAreas": ["area1", "area2"]
  },
  "systemPrompt": "You are [persona name], [brief first-person life description including age/family/role]. [2-3 sentences of in-character behavioral guidance for an AI to embody this persona in workplace conversations. Focus on communication style, decision-making approach, and interpersonal tendencies.]"
}`

          // generateText throws on failure — let Inngest retry handle it
          const { text } = await generateText({
            model: groq(process.env.GROQ_MODEL!),
            prompt,
            maxOutputTokens: 800,
          })

          const profile = JSON.parse(text) as PersonaProfile & { demographics?: Record<string, string> }

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
              extendedProfile: profile.demographics ? { demographics: profile.demographics } : {},
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
