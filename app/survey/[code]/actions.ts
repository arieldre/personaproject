'use server'

import { db } from '@/lib/db'
import { questionnaires, questionnaireResponses } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { computePersonalityVector, validateAnswers } from '@/lib/vcpq/vector'
import type { VCPQAnswers } from '@/lib/vcpq/vector'
import type { QuestionId } from '@/lib/vcpq/questions'

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; missing?: QuestionId[] }

export async function submitSurvey(
  questionnaireId: string,
  rawAnswers: Record<string, number>,
  meta: { name?: string; email?: string; userId?: string }
): Promise<SubmitResult> {
  const answers = rawAnswers as VCPQAnswers
  const { valid, missing } = validateAnswers(answers)

  if (!valid) {
    return { ok: false, error: 'Please answer all questions.', missing }
  }

  const vector = computePersonalityVector(answers)

  await db.transaction(async (tx) => {
    await tx.insert(questionnaireResponses).values({
      questionnaireId,
      respondentName: meta.name ?? null,
      respondentEmail: meta.email ?? null,
      userId: meta.userId ?? null,
      status: 'completed',
      answers: rawAnswers,
      personalityVector: vector,
      rawSurveyScores: rawAnswers,
      completedAt: new Date(),
    })

    // Increment total_responses counter
    await tx
      .update(questionnaires)
      .set({ totalResponses: sql`${questionnaires.totalResponses} + 1` })
      .where(eq(questionnaires.id, questionnaireId))
  })

  return { ok: true }
}
