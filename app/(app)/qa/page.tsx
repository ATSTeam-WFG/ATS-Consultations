'use client'

import { useState, useEffect } from 'react'
import { MessagesSquare, X } from 'lucide-react'
import type { QAConversation, QAMessage } from '@/lib/types'
import { ConversationSidebar } from '@/components/qa/ConversationSidebar'
import { MessageThread } from '@/components/qa/MessageThread'
import { ChatInput } from '@/components/qa/ChatInput'

export default function QAPage() {
  const [conversations, setConversations] = useState<QAConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<QAMessage[]>([])
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    setInitLoading(true)
    const res = await fetch('/api/qa/conversations')
    const json = await res.json()
    const convs: QAConversation[] = json.data ?? []
    setConversations(convs)
    if (convs.length > 0) {
      await selectConversation(convs[0].id)
    }
    setInitLoading(false)
  }

  async function selectConversation(id: string) {
    setActiveConversationId(id)
    const res = await fetch(`/api/qa/conversations/${id}`)
    const json = await res.json()
    setMessages(json.data?.messages ?? [])
  }

  async function createConversation() {
    setLoading(true)
    const res = await fetch('/api/qa/conversations', { method: 'POST' })
    const json = await res.json()
    if (json.data) {
      setConversations((prev) => [json.data, ...prev])
      setActiveConversationId(json.data.id)
      setMessages([])
    }
    setLoading(false)
  }

  async function sendMessage(content: string) {
    if (!activeConversationId) {
      // Auto-create conversation
      const res = await fetch('/api/qa/conversations', { method: 'POST' })
      const json = await res.json()
      if (!json.data) return
      const newId = json.data.id
      setConversations((prev) => [json.data, ...prev])
      setActiveConversationId(newId)
      await sendToConversation(newId, content, true)
    } else {
      await sendToConversation(activeConversationId, content, messages.length === 0)
    }
  }

  async function sendToConversation(convId: string, content: string, isFirst: boolean) {
    setLoading(true)
    setStreamingContent('')

    // Optimistically add user message
    const userMsg: QAMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content,
      context_used: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/qa/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId, message: content }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let sources: unknown[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                accumulated += data.text
                setStreamingContent(accumulated)
              }
              if (data.done) {
                sources = data.sources ?? []
              }
              if (data.error) {
                throw new Error(data.error)
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      // Add final assistant message
      const assistantMsg: QAMessage = {
        id: `ai-${Date.now()}`,
        conversation_id: convId,
        role: 'assistant',
        content: accumulated,
        context_used: sources as QAMessage['context_used'],
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Generate title on first message
      if (isFirst) {
        fetch('/api/qa/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: convId, first_message: content }),
        }).then((r) => r.json()).then((j) => {
          if (j.data?.title) {
            setConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, title: j.data.title } : c))
            )
          }
        })
      }
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setStreamingContent(null)
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="qa-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="qa-shell" style={{ display: 'flex', height: '100%', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 45, display: 'none',
          }}
          className="qa-mobile-overlay"
        />
      )}

      {/* Conversation sidebar — hidden on mobile unless open */}
      <div className={`qa-conv-sidebar${mobileSidebarOpen ? ' qa-conv-sidebar--open' : ''}`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => { selectConversation(id); setMobileSidebarOpen(false) }}
          onNew={() => { createConversation(); setMobileSidebarOpen(false) }}
          loading={loading}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div
          style={{
            height: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)',
            flexShrink: 0,
            gap: '0.75rem',
          }}
        >
          {/* Mobile chats toggle — only visible on mobile */}
          <button
            className="qa-conv-toggle"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.625rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              flexShrink: 0,
            }}
            aria-label="Toggle conversations"
          >
            {mobileSidebarOpen ? <X size={16} /> : <MessagesSquare size={16} />}
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conversations.find((c) => c.id === activeConversationId)?.title ?? 'Ask'}
          </span>
        </div>

        <MessageThread
          messages={messages}
          streamingContent={streamingContent}
          loading={loading}
        />

        <ChatInput onSubmit={sendMessage} loading={loading} />
      </div>
    </div>
  )
}
