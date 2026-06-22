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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'var(--muted-foreground)',
          gap: '0.75rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem' }}>💬</div>
        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>Ask anything about your data</div>
        <p style={{ fontSize: '0.875rem', maxWidth: '420px' }}>
          Ask about agent performance, recurring problems, which playbooks to use, trends across sessions, and more.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.5rem',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          {[
            'What are the most common problems across all sessions?',
            'Which agents are struggling with pipeline velocity?',
            'What playbook should I use for sourcing issues?',
          ].map((example) => (
            <div
              key={example}
              style={{
                padding: '0.5rem 0.875rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                background: 'var(--card)',
                cursor: 'default',
              }}
            >
              {example}
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
