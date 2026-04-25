'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  personaId: string
  personaName: string
  personaRole: string
  consultTagline: string
  avatarColor: string
}

export default function ConsultSession({
  personaId,
  personaName,
  personaRole,
  consultTagline,
  avatarColor,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)
    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch(`/api/chat/${encodeURIComponent(personaId)}?mode=consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        setError(resp.status === 429 ? 'Rate limit reached — wait a moment.' : 'Something went wrong.')
        setIsLoading(false)
        return
      }

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Network error')
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [input, isLoading, messages, personaId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsLoading(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {personaName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white leading-tight">{personaName}</p>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/15 text-violet-400">
                Consult
              </span>
            </div>
            <p className="text-xs text-neutral-500">{personaRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Clear chat
            </button>
          )}
          <Link
            href="/training"
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Training
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {personaName[0]}
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{personaName}</p>
              <p className="text-xs text-neutral-500 max-w-xs">{consultTagline}</p>
            </div>
            <p className="text-sm text-neutral-400 max-w-sm">
              Ask anything — get direct, expert advice with no sugarcoating.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            data-testid="consult-message"
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-800 px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-xs text-red-400" role="alert">{error}</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 px-6 py-4 flex items-end gap-3">
        <textarea
          ref={textareaRef}
          data-testid="consult-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${personaName} anything…`}
          rows={1}
          disabled={isLoading}
          maxLength={3000}
          className="flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '160px', overflowY: 'auto' }}
        />
        <button
          data-testid="consult-send-btn"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
