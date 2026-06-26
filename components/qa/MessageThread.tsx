'use client'

import { useEffect, useRef } from 'react'
import type { QAMessage } from '@/lib/types'
import { MessageBubble } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'

interface MessageThreadProps {
  messages: QAMessage[]
  streamingContent: string | null
  loading: boolean
  onExampleClick?: (text: string) => void
}

const EXAMPLE_CATEGORIES = [
  {
    icon: '📊',
    label: 'Your Data',
    examples: [
      'Which agents have the most recurring problems?',
      "What are the top pain points across all my sessions?",
    ],
  },
  {
    icon: '🏢',
    label: 'Operations',
    examples: [
      'What are best practices for wire fraud prevention?',
      'Walk me through TRID compliance requirements',
    ],
  },
  {
    icon: '⚙️',
    label: 'Tech & Tools',
    examples: [
      'Best TPS for a mid-size title agency?',
      'What automation wins should I prioritize first?',
    ],
  },
  {
    icon: '📈',
    label: 'Strategy',
    examples: [
      'How do I pitch tech adoption to a resistant agent?',
      'How should I grow realtor relationships for an agent?',
    ],
  },
]

export function MessageThread({ messages, streamingContent, loading, onExampleClick }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  useEffect(() => {
    const prev = prevLengthRef.current
    const next = messages.length
    prevLengthRef.current = next
    // Conversation switch (many msgs at once) → instant jump to bottom
    // New single message added → smooth scroll
    const behavior: ScrollBehavior = next - prev > 1 ? 'instant' : 'smooth'
    bottomRef.current?.scrollIntoView({ behavior })
  }, [messages])

  useEffect(() => {
    if (streamingContent !== null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamingContent])

  if (messages.length === 0 && !loading) {
    return (
      <div className="qa-empty-state">
        <div className="qa-empty-state__icon">💬</div>
        <div className="qa-empty-state__title">Your title industry expert is ready</div>
        <p className="qa-empty-state__sub">
          Ask about your agents, industry operations, technology, or growth strategy.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', width: '100%', maxWidth: '560px' }}>
          {EXAMPLE_CATEGORIES.map((cat) => (
            <div key={cat.label} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              padding: '0.875rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>{cat.icon}</span> {cat.label}
              </div>
              {cat.examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => onExampleClick?.(ex)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem 0',
                    fontSize: '0.8125rem',
                    color: 'var(--ats-indigo)',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minHeight: 0,
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {streamingContent !== null && (
        <StreamingMessage content={streamingContent} />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
