'use client'

import { useState, useRef, useEffect } from 'react'
import { type Scenario } from '@/lib/training/scenarios'

interface Props {
  scenario: Scenario
  personas: { id: string; name: string }[]
}

type Message = { role: 'user' | 'assistant'; content: string }

type SessionState = 'setup' | 'active' | 'grading' | 'results'

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

const difficultyColor: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full bg-neutral-800 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full bg-blue-500 transition-all"
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

export function TrainingSession({ scenario, personas }: Props) {
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0]?.id ?? '')
  const [state, setState] = useState<SessionState>('setup')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const userTurns = messages.filter((m) => m.role === 'user').length

  async function startSession() {
    if (!selectedPersonaId) return
    setState('active')
  }

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setSending(true)

    try {
      // Include scenario context as first system-ish user message so the persona
      // knows the scenario without modifying its base system prompt server-side.
      const contextPrefix: Message = {
        role: 'user',
        content: `[SCENARIO CONTEXT — not part of the conversation]: ${scenario.systemPromptSuffix}`,
      }

      const payload = {
        messages: next.length === 1 ? [contextPrefix, ...next] : next,
      }

      const res = await fetch(`/api/chat/${selectedPersonaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Chat error: ${res.status}`)

      // Parse the streaming data stream response from Vercel AI SDK
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Vercel AI SDK data stream format: lines starting with "0:" are text chunks
        for (const line of chunk.split('\n')) {
          if (line.startsWith('0:')) {
            try {
              const raw = JSON.parse(line.slice(2))
              assistantText += raw
            } catch {
              // not a text chunk — skip
            }
          }
        }
      }

      setMessages([...next, { role: 'assistant', content: assistantText }])
    } catch (err) {
      console.error('sendMessage failed:', err)
    } finally {
      setSending(false)
    }
  }

  async function endSession() {
    setState('grading')

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
      const { jobId } = (await res.json()) as { jobId: string; trainingSessionId: string }

      // Poll until the job completes
      await pollJob(jobId)
    } catch (err) {
      console.error('endSession failed:', err)
      setState('active')
    }
  }

  async function pollJob(jobId: string) {
    const interval = setInterval(async () => {
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
          setState('results')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setState('active')
        }
      } catch {
        // transient error — keep polling
      }
    }, 3000)
  }

  function tryAgain() {
    setMessages([])
    setGradeResult(null)
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
            <label className="block text-xs font-medium text-neutral-400 mb-2">Choose a persona</label>
            {personas.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">
                No active personas available. Generate personas from the Admin panel first.
              </p>
            ) : (
              <select
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            data-testid="start-session-btn"
            onClick={startSession}
            disabled={!selectedPersonaId}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
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
        </div>
      </main>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (state === 'results' && gradeResult) {
    const dimensions: { key: keyof Omit<GradeResult, 'overallScore'>; label: string }[] = [
      { key: 'communication', label: 'Communication' },
      { key: 'empathy', label: 'Empathy' },
      { key: 'problemSolving', label: 'Problem Solving' },
      { key: 'professionalism', label: 'Professionalism' },
    ]

    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Overall Score</p>
            <p
              data-testid="overall-score"
              className="text-7xl font-bold text-white tabular-nums"
            >
              {gradeResult.overallScore}
            </p>
            <p className="text-neutral-500 text-sm mt-1">out of 100</p>
          </div>

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
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{dim.feedback}</p>
                </div>
              )
            })}
          </div>

          <button
            onClick={tryAgain}
            className="w-full py-2.5 rounded-lg border border-neutral-700 hover:border-neutral-500 text-sm font-medium text-white transition-colors"
          >
            Try Again
          </button>
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
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors"
          >
            End Session &amp; Grade
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-neutral-600 mt-10">
            Start the conversation — you&apos;ll be playing the role described in the scenario.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
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
        <div className="flex gap-3">
          <input
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
            placeholder="Type your response…"
            value={input}
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
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
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
