import { NonRetriableError } from 'inngest'
import { inngest } from '../client'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { db } from '@/lib/db'
import { trainingSessions, jobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getScenario } from '@/lib/training/scenarios'

interface GradeEventData {
  jobId: string
  companyId: string
  trainingSessionId: string
}

interface DimensionResult {
  score: number
  feedback: string
}

interface GradeResult {
  communication: DimensionResult
  empathy: DimensionResult
  problemSolving: DimensionResult
  professionalism: DimensionResult
  overallScore: number
}

type ConversationMessage = { role: string; content: string }

function buildGradingPrompt(
  scenarioTitle: string,
  scenarioDifficulty: string,
  dimension: string,
  rubricText: string,
  messages: ConversationMessage[],
): string {
  const formatted = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Persona'}: ${m.content}`)
    .join('\n')

  return `You are a workplace communication expert grading a training scenario conversation.

Scenario: ${scenarioTitle} (${scenarioDifficulty})
Rubric for ${dimension}: ${rubricText}

Conversation:
${formatted}

Grade the user's ${dimension} on a scale of 0-100.
Respond with ONLY valid JSON: { "score": <number>, "feedback": "<one sentence>" }`
}

async function gradeDimension(
  groq: ReturnType<typeof createGroq>,
  scenarioTitle: string,
  scenarioDifficulty: string,
  dimension: string,
  rubricText: string,
  messages: ConversationMessage[],
): Promise<DimensionResult> {
  const prompt = buildGradingPrompt(scenarioTitle, scenarioDifficulty, dimension, rubricText, messages)

  const { text } = await generateText({
    model: groq(process.env.GROQ_MODEL!),
    prompt,
    temperature: 0.3,
    maxOutputTokens: 200,
  })

  // Strip markdown code fences if the model wraps JSON anyway
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(clean) as DimensionResult
  return parsed
}

export const gradeFn = inngest.createFunction(
  {
    id: 'grade-training-session',
    triggers: [{ event: 'training/grade.requested' }],
    onFailure: async ({ event }) => {
      const { jobId, companyId } = event.data.event.data as { jobId: string; companyId: string }
      await db
        .update(jobs)
        .set({ status: 'failed', error: 'Grading job exceeded retry limit', updatedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    },
  },
  async ({ event, step }) => {
    const data = event.data as unknown as GradeEventData

    // Step 1: validate payload — NonRetriableError skips retries for bad input
    await step.run('validate', async () => {
      if (
        typeof data.jobId !== 'string' ||
        typeof data.companyId !== 'string' ||
        typeof data.trainingSessionId !== 'string'
      ) {
        throw new NonRetriableError('invalid payload: jobId, companyId, trainingSessionId must be strings')
      }
    })

    const { jobId, companyId, trainingSessionId } = data

    // Step 2: mark job running
    await step.run('mark-running', async () => {
      await db
        .update(jobs)
        .set({ status: 'running', updatedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    })

    // Step 3: load the training session
    const sessionRow = await step.run('load-session', async () => {
      const [row] = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.id, trainingSessionId))
        .limit(1)

      if (!row) {
        throw new NonRetriableError(`Training session ${trainingSessionId} not found`)
      }

      return row
    })

    // Step 4: validate scenario exists
    const scenario = await step.run('load-scenario', async () => {
      const found = getScenario(sessionRow.scenarioId)
      if (!found) {
        throw new NonRetriableError(`Unknown scenarioId: ${sessionRow.scenarioId}`)
      }
      return found
    })

    const messages = sessionRow.messages as ConversationMessage[]

    // Steps 5–8: grade each dimension independently so individual failures retry alone
    const communication = await step.run('grade-communication', async () => {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      return gradeDimension(
        groq,
        scenario.title,
        scenario.difficulty,
        'communication',
        scenario.rubric.communication,
        messages,
      )
    })

    const empathy = await step.run('grade-empathy', async () => {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      return gradeDimension(
        groq,
        scenario.title,
        scenario.difficulty,
        'empathy',
        scenario.rubric.empathy,
        messages,
      )
    })

    const problemSolving = await step.run('grade-problem-solving', async () => {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      return gradeDimension(
        groq,
        scenario.title,
        scenario.difficulty,
        'problem solving',
        scenario.rubric.problemSolving,
        messages,
      )
    })

    const professionalism = await step.run('grade-professionalism', async () => {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      return gradeDimension(
        groq,
        scenario.title,
        scenario.difficulty,
        'professionalism',
        scenario.rubric.professionalism,
        messages,
      )
    })

    // Step 9: compute average, persist, mark complete
    await step.run('compute-result', async () => {
      const overallScore = Math.round(
        (communication.score + empathy.score + problemSolving.score + professionalism.score) / 4,
      )

      const gradeResult: GradeResult = {
        communication,
        empathy,
        problemSolving,
        professionalism,
        overallScore,
      }

      await db
        .update(trainingSessions)
        .set({ gradeResult, overallScore })
        .where(eq(trainingSessions.id, trainingSessionId))

      await db
        .update(jobs)
        .set({ status: 'complete', updatedAt: new Date(), completedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))

      return { overallScore, gradeResult }
    })

    return { jobId, trainingSessionId }
  },
)
