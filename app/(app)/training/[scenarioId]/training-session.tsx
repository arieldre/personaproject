'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { type Scenario } from '@/lib/training/scenarios'

interface DefaultPersonaInfo {
  id: string
  name: string
  role: string
  avatarColor: string
}

interface Props {
  scenario: Scenario
  personas: { id: string; name: string }[]
  defaultPersona?: DefaultPersonaInfo
}

type Message = { role: 'user' | 'assistant'; content: string }
type SessionState = 'setup' | 'active' | 'grading' | 'results' | 'error'

interface DimensionResult {
  score: number
  reasoning: string
}

interface GradeResult {
  goalAchievement: DimensionResult
  communicationClarity: DimensionResult
  empathyListening: DimensionResult
  problemSolving: DimensionResult
  professionalism: DimensionResult
  overallFeedback: string
  grade: string
}

const difficultyColor: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

const gradeColor: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-emerald-500' :
    score >= 70 ? 'bg-blue-500' :
    score >= 55 ? 'bg-yellow-500' :
    score >= 40 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="w-full bg-neutral-800 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

// Polling timeout: 60 attempts × 3s = 3 minutes max
const MAX_POLL_ATTEMPTS = 60

export function TrainingSession({ scenario, personas, defaultPersona }: Props) {
  const isDefaultMode = !!defaultPersona
  const initialPersonaId = defaultPersona?.id ?? personas[0]?.id ?? ''

  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId)
  const [state, setState] = useState<SessionState>('setup')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [gradingError, setGradingError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const userTurns = messages.filter((m) => m.role === 'user').length

  function startSession() {
    if (!selectedPersonaId) return
    setState('active')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setSending(true)
    setSendError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    try {
      // Pass scenarioId as query param — chat route merges it into system prompt
      // This is more token-efficient than injecting as a user message prefix
      const res = await fetch(
        `/api/chat/${selectedPersonaId}?scenarioId=${encodeURIComponent(scenario.id)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next }),
          signal: controller.signal,
        }
      )

      if (!res.ok) {
        throw new Error(`Chat error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      // Add empty assistant stub so streaming updates have a target
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }

      if (!assistantText) {
        throw new Error('Empty response from AI')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSendError('Request timed out. Please try again.')
      } else {
        setSendError('Failed to send. Please try again.')
      }
      // Remove the user message we optimistically added
      setMessages(messages)
    } finally {
      clearTimeout(timeout)
      setSending(false)
    }
  }

  async function endSession() {
    setState('grading')
    setGradingError(null)

    try {
      const res = await fetch('/api/training/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          scenarioId: scenario.id,
          personaId: selectedPersonaId,
        }),
      })

      if (!res.ok) throw new Error(`Grade request failed: ${res.status}`)
      const { jobId } = (await res.json()) as { jobId: string }

      await pollJob(jobId)
    } catch (err) {
      console.error('endSession failed:', err)
      setGradingError('Grading failed. You can try again.')
      setState('error')
    }
  }

  async function pollJob(jobId: string) {
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++

      // Timeout after MAX_POLL_ATTEMPTS (3 minutes)
      if (attempts > MAX_POLL_ATTEMPTS) {
        clearInterval(interval)
        setGradingError('Grading is taking longer than expected. Please try again.')
        setState('error')
        return
      }

      try {
        const res = await fetch(`/api/training/job/${jobId}`)
        if (!res.ok) return

        const data = (await res.json()) as {
          status: string
          gradeResult?: GradeResult
          overallScore?: number
        }

        if (data.status === 'complete' && data.gradeResult) {
          clearInterval(interval)
          setGradeResult(data.gradeResult)
          setOverallScore(data.overallScore ?? null)
          setState('results')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setGradingError('Grading job failed. Please try again.')
          setState('error')
        }
      } catch {
        // transient network error — keep polling
      }
    }, 3000)
  }

  function tryAgain() {
    setMessages([])
    setGradeResult(null)
    setOverallScore(null)
    setGradingError(null)
    setState('setup')
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (state === 'setup') {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{scenario.archetype}</span>
              <span className={`text-xs capitalize font-medium ${difficultyColor[scenario.difficulty]}`}>
                {scenario.difficulty}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">{scenario.title}</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">{scenario.description}</p>
          </div>

          <div className="mb-6">
            {isDefaultMode && defaultPersona ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ backgroundColor: defaultPersona.avatarColor }}
                >
                  {defaultPersona.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{defaultPersona.name}</p>
                  <p className="text-xs text-neutral-500">{defaultPersona.role}</p>
                </div>
              </div>
            ) : personas.length === 0 ? (
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-4">
                <p className="text-sm text-neutral-500 italic mb-3">
                  No active personas available. Generate personas from the Admin panel first.
                </p>
                <Link
                  href="/admin/personas"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Go to Admin → Personas
                </Link>
              </div>
            ) : (
              <>
                <label className="block text-xs font-medium text-neutral-400 mb-2">Choose a persona</label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          <button
            data-testid="start-session-btn"
            onClick={startSession}
            disabled={!selectedPersonaId || (!isDefaultMode && personas.length === 0)}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Start Session
          </button>
        </div>
      </main>
    )
  }

  // ── Grading screen ────────────────────────────────────────────────────────
  if (state === 'grading') {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">Grading your conversation…</p>
          <p className="text-neutral-600 text-xs mt-2">Usually takes 10–30 seconds</p>
        </div>
      </main>
    )
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <p className="text-red-400 text-sm mb-4">{gradingError ?? 'Something went wrong.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setState('active')}
              className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 text-sm font-medium text-white transition-colors"
            >
              Back to Chat
            </button>
            <button
              onClick={tryAgain}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (state === 'results' && gradeResult) {
    const dimensions: { key: keyof Omit<GradeResult, 'overallFeedback' | 'grade'>; label: string }[] = [
      { key: 'goalAchievement', label: 'Goal Achievement' },
      { key: 'communicationClarity', label: 'Communication' },
      { key: 'empathyListening', label: 'Empathy & Listening' },
      { key: 'problemSolving', label: 'Problem Solving' },
      { key: 'professionalism', label: 'Professionalism' },
    ]

    const score = overallScore ?? 0
    const grade = gradeResult.grade ?? 'C'

    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10">
        <div className="max-w-lg mx-auto">
          {/* Overall score */}
          <div className="text-center mb-8">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Overall Score</p>
            <div className="flex items-end justify-center gap-3">
              <p
                data-testid="overall-score"
                className="text-7xl font-bold text-white tabular-nums leading-none"
              >
                {score}
              </p>
              <div className="mb-2">
                <span className={`text-4xl font-bold tabular-nums ${gradeColor[grade] ?? 'text-white'}`}>
                  {grade}
                </span>
                <p className="text-xs text-neutral-600">out of 100</p>
              </div>
            </div>
          </div>

          {/* Per-dimension bars */}
          <div className="space-y-5 mb-8">
            {dimensions.map(({ key, label }) => {
              const dim = gradeResult[key]
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white font-medium">{label}</span>
                    <span className="text-sm text-neutral-400 tabular-nums">{dim.score}</span>
                  </div>
                  <ScoreBar score={dim.score} />
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{dim.reasoning}</p>
                </div>
              )
            })}
          </div>

          {/* Overall feedback */}
          {gradeResult.overallFeedback && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 mb-6">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Feedback</p>
              <p className="text-sm text-neutral-200 leading-relaxed">{gradeResult.overallFeedback}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={tryAgain}
              className="flex-1 py-2.5 rounded-lg border border-neutral-700 hover:border-neutral-500 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              Try Again
            </button>
            <Link
              href="/training"
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              More Scenarios
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── Active chat screen ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-neutral-500">{scenario.archetype} · {scenario.difficulty}</p>
          <p className="text-sm font-medium text-white">{scenario.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{userTurns} {userTurns === 1 ? 'turn' : 'turns'}</span>
          <button
            data-testid="end-session-btn"
            onClick={endSession}
            disabled={userTurns < 3}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            End &amp; Grade
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <p
            role="status"
            className="text-center text-xs text-neutral-600 mt-10"
          >
            Start the conversation — you are playing the role described in the scenario.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-xl px-4 py-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 px-6 py-4 shrink-0">
        {sendError && (
          <p className="text-xs text-red-400 mb-2 text-center">{sendError}</p>
        )}
        <div className="flex gap-3">
          <input
            ref={inputRef}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
            placeholder="Type your response…"
            value={input}
            maxLength={3000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
        {userTurns < 3 && (
          <p className="text-xs text-neutral-600 mt-2 text-center">
            Complete at least 3 turns to enable grading
          </p>
        )}
      </div>
    </main>
  )
}
