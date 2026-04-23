import type { QuestionId } from './questions'
import { QUESTIONS } from './questions'

export type VCPQAnswers = Partial<Record<QuestionId, number>>

// 14 dimensions in fixed index order — matches pgvector column
export const DIMENSIONS = [
  'innovation',
  'diligence',
  'social_energy',
  'agreeableness',
  'directness',
  'verbosity',
  'formality',
  'jargon_density',
  'deference',
  'autonomy',
  'sycophancy',
  'conflict_mode',
  'decision_basis',
  'stress_resilience',
] as const

export type Dimension = typeof DIMENSIONS[number]

function normalize(score: number, reversed: boolean): number {
  // Map Likert 1-5 → [-1, 1]. Flip sign for reversed questions.
  const v = (score - 3) / 2
  return reversed ? -v : v
}

export function computePersonalityVector(answers: VCPQAnswers): number[] {
  // Group normalized scores by dimension
  const buckets: Record<string, number[]> = {}

  for (const q of QUESTIONS) {
    const score = answers[q.id]
    if (score == null) continue
    if (!buckets[q.dimension]) buckets[q.dimension] = []
    buckets[q.dimension].push(normalize(score, q.reversed))
  }

  // Average each dimension bucket → fixed-order 14-element array
  return DIMENSIONS.map((dim) => {
    const vals = buckets[dim]
    if (!vals || vals.length === 0) return 0
    return vals.reduce((s, v) => s + v, 0) / vals.length
  })
}

export function validateAnswers(answers: VCPQAnswers): { valid: boolean; missing: QuestionId[] } {
  const missing = QUESTIONS
    .map((q) => q.id)
    .filter((id) => {
      const v = answers[id]
      return v == null || v < 1 || v > 5
    }) as QuestionId[]

  return { valid: missing.length === 0, missing }
}

export function vectorToRecord(vector: number[]): Record<Dimension, number> {
  return Object.fromEntries(DIMENSIONS.map((dim, i) => [dim, vector[i]])) as Record<Dimension, number>
}
