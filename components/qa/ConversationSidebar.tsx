'use client'

import { Plus, MessageSquare } from 'lucide-react'
import type { QAConversation } from '@/lib/types'

interface ConversationSidebarProps {
  conversations: QAConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  loading: boolean
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
}: ConversationSidebarProps) {
  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
      }}
    >
      <div style={{ height: '3.5rem', display: 'flex', alignItems: 'center', padding: '0 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onNew}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                background: activeId === conv.id ? 'var(--accent)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              <MessageSquare
                size={14}
                style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '0.125rem' }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: activeId === conv.id ? 600 : 400,
                    color: 'var(--foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conv.title ?? 'New conversation'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
