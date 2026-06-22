'use client'

interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <div
        style={{
          width: '1.875rem',
          height: '1.875rem',
          borderRadius: '50%',
          background: 'var(--ats-blue)',
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
      <div
        style={{
          maxWidth: '75%',
          padding: '0.75rem 1rem',
          borderRadius: '1rem 1rem 1rem 0.25rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          fontSize: '0.875rem',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}
      >
        {content || <span style={{ opacity: 0.4 }}>Thinking...</span>}
        <span
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            background: 'var(--ats-blue)',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
          }}
        />
        <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
      </div>
    </div>
  )
}
