import { NonRetriableError } from 'inngest'
import { inngest } from '../client'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { db } from '@/lib/db'
import { trainingSessions, jobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getScenario } from '@/lib/training/scenarios'
import { z } from 'zod'

interface GradeEventData {
  jobId: string
  companyId: string
  trainingSessionId: string
}

// ── Score schema (1–5 integer with CoT reasoning) ────────────────────────────
// Research: 1-5 scale beats 0-100 for LLM judges (higher exact-match rate, avoids heaping)
// CoT: reasoning field BEFORE score field forces the model to reason into the score
const DimensionSchema = z.object({
  reasoning: z.string(),
  score: z.number().int().min(1).max(5),
})

const GradeResponseSchema = z.object({
  goalAchievement: DimensionSchema,
  communicationClarity: DimensionSchema,
  empathyListening: DimensionSchema,
  problemSolving: DimensionSchema,
  professionalism: DimensionSchema,
  overallFeedback: z.string(),
})

type GradeResponse = z.infer<typeof GradeResponseSchema>

// Weights: goalAchievement 30%, communication 20%, empathy 20%, problemSolving 15%, professionalism 15%
const WEIGHTS = {
  goalAchievement: 0.30,
  communicationClarity: 0.20,
  empathyListening: 0.20,
  problemSolving: 0.15,
  professionalism: 0.15,
}

// Convert 1-5 score to 0-100: ((score - 1) / 4) * 100
function toPercent(score: number): number {
  return Math.round(((score - 1) / 4) * 100)
}

export function computeWeightedScore(grades: GradeResponse): number {
  const pct =
    toPercent(grades.goalAchievement.score) * WEIGHTS.goalAchievement +
    toPercent(grades.communicationClarity.score) * WEIGHTS.communicationClarity +
    toPercent(grades.empathyListening.score) * WEIGHTS.empathyListening +
    toPercent(grades.problemSolving.score) * WEIGHTS.problemSolving +
    toPercent(grades.professionalism.score) * WEIGHTS.professionalism
  return Math.round(pct)
}

export function letterGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

type ConversationMessage = { role: 'user' | 'assistant'; content: string }

function buildGradingPrompt(
  scenarioTitle: string,
  scenarioDifficulty: string,
  scenarioGoal: string,
  rubric: { communication: string; empathy: string; problemSolving: string; professionalism: string },
  messages: ConversationMessage[],
): string {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Manager' : 'AI Character'}: ${m.content}`)
    .join('\n')

  return `You are a training evaluator for a manager development program. Evaluate the trainee (the Manager) in the transcript below.
Think carefully. Output ONLY valid JSON — no prose, no code fences.

## Scenario
Title: ${scenarioTitle} (${scenarioDifficulty})
Manager's Goal: ${scenarioGoal}

## Rubric Context
- Communication: ${rubric.communication}
- Empathy: ${rubric.empathy}
- Problem Solving: ${rubric.problemSolving}
- Professionalism: ${rubric.professionalism}

## Transcript
${transcript}

## Scoring Rubric (1–5 integer per dimension)

### 1. Goal Achievement — Did the manager accomplish the stated scenario goal?
5 — Goal fully achieved: clear commitment or resolution reached
4 — Goal substantially achieved: meaningful progress, minor gap
3 — Partial: some movement but goal not reached
2 — Minimal: attempted but no meaningful progress
1 — Not achieved: no progress, situation unchanged or worsened

### 2. Communication Clarity
5 — Clear, structured, appropriately direct without being blunt
4 — Mostly clear with minor ambiguity
3 — Understandable but vague or rambling in places
2 — Often unclear, message frequently lost
1 — Confusing, contradictory, or incoherent

### 3. Empathy & Active Listening
5 — Consistently validated emotions, asked clarifying questions, adapted to responses
4 — Good empathy with occasional missed signals
3 — Some acknowledgment but mechanical or perfunctory
2 — Minimal — treated as transactional
1 — Dismissive, ignored emotional cues entirely

### 4. Problem-Solving & Judgment
5 — Identified root cause, proposed specific actionable solutions, showed good judgment
4 — Good diagnosis, solutions workable but not optimal
3 — Generic solutions, missed key factors
2 — Reactive, no real problem-solving
1 — Worsened the situation or made poor judgments

### 5. Professionalism & Tone
5 — Appropriate authority, composed, role-appropriate throughout
4 — Generally professional, minor lapses
3 — Occasional unprofessional moments
2 — Frequently off-tone or inappropriate
1 — Unprofessional throughout

## Important
- Scores of 1 and 2 are expected and appropriate when the criterion is clearly not met.
- Length of responses is NOT a proxy for quality.
- Base all scores on specific observable moments in the transcript.

## Output Format
{"goalAchievement":{"reasoning":"...","score":<1-5>},"communicationClarity":{"reasoning":"...","score":<1-5>},"empathyListening":{"reasoning":"...","score":<1-5>},"problemSolving":{"reasoning":"...","score":<1-5>},"professionalism":{"reasoning":"...","score":<1-5>},"overallFeedback":"2-3 sentences: what the manager did well, what to improve, one specific suggestion"}`
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

    // Step 1: validate payload
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

    // Step 3: load training session with tenant isolation check
    const sessionRow = await step.run('load-session', async () => {
      const [row] = await db
        .select()
        .from(trainingSessions)
        .where(
          and(
            eq(trainingSessions.id, trainingSessionId),
            eq(trainingSessions.companyId, companyId),
          )
        )
        .limit(1)

      if (!row) {
        throw new NonRetriableError(`Training session ${trainingSessionId} not found or access denied`)
      }
      return row
    })

    // Step 4: validate scenario
    const scenario = await step.run('load-scenario', async () => {
      const found = getScenario(sessionRow.scenarioId)
      if (!found) {
        throw new NonRetriableError(`Unknown scenarioId: ${sessionRow.scenarioId}`)
      }
      return found
    })

    const messages = sessionRow.messages as ConversationMessage[]

    // Step 5: single Groq call for all dimensions
    // Research: single call is better for interdependent dimensions (vs 4 separate calls)
    // CoT: reasoning field forces model to justify each score before emitting it
    const rawGrades = await step.run('grade-all-dimensions', async () => {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      const prompt = buildGradingPrompt(
        scenario.title,
        scenario.difficulty,
        scenario.description,
        scenario.rubric,
        messages,
      )

      const { text } = await generateText({
        model: groq(process.env.GROQ_MODEL!),
        prompt,
        temperature: 0,
        maxOutputTokens: 800,
      })

      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

      let parsed: unknown
      try {
        parsed = JSON.parse(clean)
      } catch {
        throw new NonRetriableError(`Groq returned malformed JSON: ${clean.slice(0, 200)}`)
      }

      // Zod validation — catches missing/invalid fields from LLM
      const result = GradeResponseSchema.safeParse(parsed)
      if (!result.success) {
        throw new NonRetriableError(`Grade response schema invalid: ${result.error.message}`)
      }
      return result.data
    })

    // Step 6: compute weighted score, persist, mark complete
    await step.run('compute-result', async () => {
      const overallScore = computeWeightedScore(rawGrades)
      const grade = letterGrade(overallScore)

      const gradeResult = {
        goalAchievement: { score: toPercent(rawGrades.goalAchievement.score), reasoning: rawGrades.goalAchievement.reasoning },
        communicationClarity: { score: toPercent(rawGrades.communicationClarity.score), reasoning: rawGrades.communicationClarity.reasoning },
        empathyListening: { score: toPercent(rawGrades.empathyListening.score), reasoning: rawGrades.empathyListening.reasoning },
        problemSolving: { score: toPercent(rawGrades.problemSolving.score), reasoning: rawGrades.problemSolving.reasoning },
        professionalism: { score: toPercent(rawGrades.professionalism.score), reasoning: rawGrades.professionalism.reasoning },
        overallFeedback: rawGrades.overallFeedback,
        grade,
        weights: WEIGHTS,
      }

      await db
        .update(trainingSessions)
        .set({ gradeResult, overallScore })
        .where(eq(trainingSessions.id, trainingSessionId))

      await db
        .update(jobs)
        .set({ status: 'complete', updatedAt: new Date(), completedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))

      return { overallScore, grade }
    })

    return { jobId, trainingSessionId }
  },
)
