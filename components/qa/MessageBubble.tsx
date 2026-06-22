'use client'

import { useState } from 'react'
import type { QAMessage, ContextUsed } from '@/lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MessageBubbleProps {
  message: QAMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showContext, setShowContext] = useState(false)
  const isUser = message.role === 'user'
  const sources = message.context_used as ContextUsed[] | null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: '0.75rem',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '1.875rem',
            height: '1.875rem',
            borderRadius: '50%',
            background: 'var(--ats-indigo)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6875rem',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: '0.25rem',
          }}
        >
          AI
        </div>
      )}

      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
            background: isUser ? 'var(--ats-indigo)' : 'var(--card)',
            color: isUser ? '#fff' : 'var(--foreground)',
            border: isUser ? 'none' : '1px solid var(--border)',
            fontSize: '0.875rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <button
            onClick={() => setShowContext(!showContext)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem 0',
            }}
          >
            {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {sources.length} source{sources.length !== 1 ? 's' : ''} used
          </button>
        )}

        {!isUser && showContext && sources && sources.length > 0 && (
          <div
            style={{
              padding: '0.625rem',
              background: 'var(--muted)',
              borderRadius: '0.375rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {sources.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.125rem 0.375rem',
                    background: 'var(--ats-indigo-light)',
                    color: 'var(--ats-indigo-dark)',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  {src.type}
                </span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{src.label}</div>
                  {src.excerpt && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{src.excerpt}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
