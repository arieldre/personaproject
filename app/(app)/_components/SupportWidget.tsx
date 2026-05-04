'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    'Hi! I\'m your Persona Platform assistant. Ask me anything about setting up surveys, generating personas, or using the training features.',
}

const QUICK_ACTIONS = [
  'How do I add employees?',
  'Why are there no personas yet?',
  'How does the match feature work?',
]

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    // Add empty assistant bubble to stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: 'assistant',
            content:
              res.status === 429
                ? 'You\'ve sent a lot of messages. Please wait a moment before trying again.'
                : `Something went wrong (${errText || res.status}). Please try again.`,
          },
        ])
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          // Remove the [ESCALATE] token before rendering — it's internal
          const displayText = assistantText.replace(/\[ESCALATE\]\s*$/i, '').trim()
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: displayText },
          ])
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'Network error. Please check your connection and try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showQuickActions = messages.length === 1 // only initial message

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      data-testid="support-widget"
    >
      {isOpen && (
        <div className="w-80 h-[420px] flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
            <span className="text-sm font-medium text-white">Help</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white transition-colors text-lg leading-none"
              aria-label="Close support widget"
            >
              ×
            </button>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-white text-neutral-900'
                      : 'bg-neutral-800 text-neutral-100'
                  }`}
                >
                  {msg.content || (isLoading && msg.role === 'assistant' ? '...' : '')}
                </div>
              </div>
            ))}

            {/* Quick action buttons — only show before first user message */}
            {showQuickActions && (
              <div className="flex flex-col gap-1.5 pt-1">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="text-left text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 rounded-md px-3 py-2 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 py-3 border-t border-neutral-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="px-3 py-1.5 rounded-md bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 text-center text-[10px] text-neutral-600 pb-2">
            Powered by Groq · Free
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close help' : 'Open help'}
        data-testid="support-toggle"
        className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 flex items-center justify-center text-lg font-medium shadow-lg transition-colors"
      >
        {isOpen ? '×' : '?'}
      </button>
    </div>
  )
}
