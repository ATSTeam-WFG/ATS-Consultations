'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  loading: boolean
}

export function ChatInput({ onSubmit, loading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  return (
    <div
      style={{
        padding: '1rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.625rem 0.875rem',
          transition: 'border-color 0.15s',
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your agents, sessions, trends... (Enter to send)"
          disabled={loading}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            minHeight: '24px',
            maxHeight: '160px',
            overflow: 'auto',
            color: 'var(--foreground)',
            fontFamily: 'inherit',
          }}
          rows={1}
        />
        <button
          onClick={submit}
          disabled={!value.trim() || loading}
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            background: value.trim() && !loading ? 'var(--ats-blue)' : 'var(--muted)',
            color: value.trim() && !loading ? '#fff' : 'var(--muted-foreground)',
            border: 'none',
            cursor: value.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <Send size={14} />
        </button>
      </div>
      <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem', textAlign: 'center' }}>
        Shift+Enter for newline
      </p>
    </div>
  )
}
