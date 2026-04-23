'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Conversation {
  id: string
  title?: string | null
  lastMessageAt?: Date | null
}

interface Persona {
  id: string
  name: string
  tagline?: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatUI({
  persona,
  conversations,
}: {
  persona: Persona
  conversations: Conversation[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    searchParams.get('c') ?? undefined
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    try {
      const resp = await fetch(`/api/chat/${persona.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, conversationId: activeConversationId }),
      })

      if (!resp.ok) {
        const msg = resp.status === 429 ? 'Rate limit reached. Wait a moment.' : 'Something went wrong.'
        setError(msg)
        setIsLoading(false)
        return
      }

      // Stream the text response chunk by chunk
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, persona.id, activeConversationId])

  const handleNewChat = useCallback(() => {
    setActiveConversationId(undefined)
    setMessages([])
    setError(null)
    router.replace(`/chat/${persona.id}`)
  }, [persona.id, router])

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 p-4">
          <p data-testid="persona-name" className="truncate text-sm font-semibold">
            {persona.name}
          </p>
          {persona.tagline && (
            <p className="mt-0.5 truncate text-xs text-neutral-400">{persona.tagline}</p>
          )}
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            + New Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 && (
            <p className="px-2 py-3 text-xs text-neutral-500">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${persona.id}?c=${conv.id}`)}
              className={[
                'mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                conv.id === activeConversationId
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100',
              ].join(' ')}
            >
              <span className="block truncate">{conv.title ?? 'Untitled'}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main chat */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center border-b border-neutral-800 px-6 py-4">
          <h1 className="text-base font-semibold">
            Chat with <span className="text-blue-400">{persona.name}</span>
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-neutral-500">Start a conversation with {persona.name}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              data-testid="message"
              className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
            >
              <div
                className={[
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-100',
                ].join(' ')}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-neutral-800 px-4 py-2.5">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-red-400">{error}</p>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-end gap-3 border-t border-neutral-800 px-6 py-4">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={`Message ${persona.name}…`}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: '160px', overflowY: 'auto' }}
          />
          <button
            data-testid="send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  )
}
