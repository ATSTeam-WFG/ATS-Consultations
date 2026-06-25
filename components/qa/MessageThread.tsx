'use client'

import { useEffect, useRef } from 'react'
import type { QAMessage } from '@/lib/types'
import { MessageBubble } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'

interface MessageThreadProps {
  messages: QAMessage[]
  streamingContent: string | null
  loading: boolean
}

export function MessageThread({ messages, streamingContent, loading }: MessageThreadProps) {
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
        <div className="qa-empty-state__title">Ask anything about your data</div>
        <p className="qa-empty-state__sub">
          Agent performance, recurring problems, playbook suggestions, trends.
        </p>
        <div className="qa-empty-state__examples">
          {[
            'What are the most common problems across all sessions?',
            'Which agents are struggling with pipeline velocity?',
            'What playbook should I use for sourcing issues?',
          ].map((example) => (
            <div key={example} className="qa-empty-state__chip">{example}</div>
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
