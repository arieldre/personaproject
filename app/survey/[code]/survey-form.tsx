'use client'

import { useState, useTransition } from 'react'
import { QUESTIONS, QUESTIONS_BY_MODULE, MODULE_LABELS, LIKERT_LABELS } from '@/lib/vcpq/questions'
import type { Module, QuestionId } from '@/lib/vcpq/questions'
import { submitSurvey } from './actions'

const MODULES: Module[] = ['A', 'B', 'C', 'D']
const TOTAL = QUESTIONS.length

interface SurveyFormProps {
  questionnaireId: string
  anonymous: boolean
  domainContext: string
}

export function SurveyForm({ questionnaireId, anonymous, domainContext }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, number>>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<QuestionId[]>([])
  const [isPending, startTransition] = useTransition()

  const answered = Object.keys(answers).length
  const pct = Math.round((answered / TOTAL) * 100)

  function setAnswer(id: QuestionId, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setMissing((prev) => prev.filter((m) => m !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitSurvey(
        questionnaireId,
        answers as Record<string, number>,
        anonymous ? {} : { name: name || undefined, email: email || undefined }
      )

      if (result.ok) {
        setSubmitted(true)
      } else {
        setError(result.error)
        if (result.missing) setMissing(result.missing)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h1 className="text-2xl font-semibold text-white">Thank you!</h1>
          <p className="text-neutral-400 text-sm">Your responses have been recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-neutral-950">
      {/* Sticky progress header */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-neutral-400 tabular-nums shrink-0">
            {answered}/{TOTAL}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Workplace Style Survey</h1>
          <p className="text-sm text-neutral-400">
            {domainContext !== 'General' ? `${domainContext} context · ` : ''}
            Rate each statement honestly — there are no right or wrong answers.
          </p>
        </div>

        {/* Identity (non-anonymous only) */}
        {!anonymous && (
          <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm font-medium text-white">Your information</p>
            <input
              data-testid="survey-name-input"
              type="text"
              placeholder="Full name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
            />
            <input
              data-testid="survey-email-input"
              type="email"
              placeholder="Work email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
            />
          </div>
        )}

        {/* Questions by module */}
        {MODULES.map((mod) => (
          <div key={mod} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                {mod}
              </span>
              <h2 className="text-sm font-medium text-neutral-300">{MODULE_LABELS[mod]}</h2>
            </div>

            <div className="space-y-3">
              {QUESTIONS_BY_MODULE[mod].map((q, i) => {
                const isMissing = missing.includes(q.id)
                const selected = answers[q.id]
                const globalIndex = QUESTIONS.findIndex((x) => x.id === q.id) + 1

                return (
                  <div
                    key={q.id}
                    data-testid={`question-${q.id}`}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isMissing
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    <p className="text-sm text-white leading-relaxed">
                      <span className="text-neutral-500 mr-2 text-xs">{globalIndex}.</span>
                      {q.text}
                    </p>

                    {/* Likert scale */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          data-testid={`q-${q.id}-opt-${v}`}
                          onClick={() => setAnswer(q.id, v)}
                          className={`rounded-lg py-2.5 text-xs font-medium transition-colors ${
                            selected === v
                              ? 'bg-white text-neutral-950'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-600 px-0.5">
                      <span>{LIKERT_LABELS[1]}</span>
                      <span>{LIKERT_LABELS[5]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            {missing.length > 0 && (
              <span className="ml-1">Scroll up to answer highlighted questions.</span>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          data-testid="survey-submit-btn"
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-white py-4 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Submitting…' : 'Submit responses'}
        </button>

        <p className="text-center text-xs text-neutral-600 pb-8">
          Your responses are used only to generate a workplace personality profile.
        </p>
      </div>
    </form>
  )
}
