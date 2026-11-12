'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Zap, Shield, Bot, Lightbulb, Settings, Wrench, CreditCard, Search, Calendar, Sparkles, Clock, Handshake } from 'lucide-react'
import { SuccessState } from './SuccessState'
import type { DiscoveryMessage, DiscoveryExtracted } from '@/lib/types'

interface DiscoveryBotProps {
  email: string
}

type BotPhase = 'idle' | 'chatting' | 'confirming' | 'success'

const INITIAL_CHIPS = [
  { icon: Bot,           label: 'AI Tools & WFG Products',   subMenu: 'tools' as const },
  { icon: MessageSquare, label: 'Order entry & closings',    message: 'My agency needs help with order entry or closings' },
  { icon: Shield,        label: 'Wire fraud & compliance',   message: "We're dealing with a wire fraud or compliance issue" },
  { icon: Zap,           label: 'Efficiency & operations',   message: 'Help me improve efficiency and operations for my client' },
  { icon: Lightbulb,     label: 'Share an idea with ATS',    subMenu: 'ideas' as const },
  { icon: Settings,      label: 'Product setup & support',   message: 'Help me set up or troubleshoot an ATS product' },
]

const TOOLS_CHIPS = [
  { icon: Wrench,     label: 'FieldMT',                       message: 'I want to learn about FieldMT' },
  { icon: Bot,        label: 'WFGPrompts',                    message: 'Tell me about WFGPrompts' },
  { icon: CreditCard, label: 'WFGRemit',                      message: 'Help me get started with WFGRemit' },
  { icon: Search,     label: 'Survey Intelligence Engine',    message: 'Tell me about the Survey Intelligence Engine' },
  { icon: Calendar,   label: 'FAR/BAR Deadline Tracker (FL)', message: 'I want to use the FAR/BAR Deadline Tracker' },
]

const IDEAS_CHIPS = [
  { icon: Sparkles,  label: 'Field Innovation',       message: "I have an innovative idea I've seen working in the field that I think ATS should know about" },
  { icon: Clock,     label: 'Efficiency Problem',      message: "There's an inefficiency consuming a lot of our time and I have a starting point to suggest" },
  { icon: Handshake, label: 'Partnership Opportunity', message: 'I want to share a networking or partnership opportunity for ATS to evaluate' },
  { icon: Wrench,    label: 'Tools Suggestion',        message: 'I want to suggest a new tool for ATS to evaluate' },
]

export function DiscoveryBot({ email }: DiscoveryBotProps) {
  const [phase, setPhase] = useState<BotPhase>('idle')
  const [activeSubMenu, setActiveSubMenu] = useState<null | 'tools' | 'ideas'>(null)
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [extracted, setExtracted] = useState<DiscoveryExtracted>({})
  const [readyToSubmit, setReadyToSubmit] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ agencyName: string; repName: string } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || streaming) return

      const userMsg: DiscoveryMessage = { role: 'user', content: userText.trim() }
      const nextMessages = [...messages, userMsg]

      setMessages(nextMessages)
      setInput('')
      setSuggestions([])
      setStreaming(true)
      setPhase('chatting')

      const assistantPlaceholder: DiscoveryMessage = { role: 'assistant', content: '' }
      setMessages((prev) => [...prev, assistantPlaceholder])

      try {
        const res = await fetch('/api/discovery/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, email }),
        })

        if (!res.body) throw new Error('No stream body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = line.slice(6).trim()
            if (!json) continue

            try {
              const parsed = JSON.parse(json)

              if (parsed.text !== undefined) {
                fullText += parsed.text
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              }

              if (parsed.suggestions) {
                setSuggestions(parsed.suggestions)
                setExtracted(parsed.extracted ?? {})
                setReadyToSubmit(parsed.readyToSubmit ?? false)
              }

              if (parsed.done) setStreaming(false)
              if (parsed.error) throw new Error(parsed.error)
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Something went wrong'
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Sorry, I ran into an issue: ${errMsg}. Please try again.`,
          }
          return updated
        })
        setStreaming(false)
      }
    },
    [messages, streaming, email]
  )

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError('')

    const agency = extracted.agency_name || 'Unknown Agency'
    const repName = email.split('@')[0].replace(/\./g, ' ')

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: agency,
          category: extracted.category || 'GOLD',
          region: extracted.region || null,
          team_size: extracted.team_size || null,
          topics: extracted.topics || [],
          situation: extracted.situation || null,
          closing_software: extracted.closing_software || null,
          request_type: extracted.request_type || null,
          request_source: 'chatbot',
          submitter_email: email,
          chat_transcript: messages,
          rep_name: repName,
          rep_email: email,
          contacts: (extracted.key_personnel ?? []).map((p) => ({
            name: p.name,
            email: p.email ?? '',
            role: '',
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Submission failed')
      }

      setSuccessData({ agencyName: agency, repName })
      setPhase('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ── SUCCESS ────────────────────────────────────────────────
  if (phase === 'success' && successData) {
    return (
      <div style={{ flex: 1, background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
        <SuccessState agencyName={successData.agencyName} repName={successData.repName} />
      </div>
    )
  }

  // ── IDLE — centered hero + glow input + horizontal chips ───
  if (phase === 'idle') {
    return (
      <div
        style={{
          flex: 1,
          background: '#0a0d14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          overflowY: 'auto',
          boxSizing: 'border-box',
          position: 'relative',
          gap: 0,
        }}
      >
        {/* Deep background glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Hero text */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            animation: 'hero-fade-up 0.5s 0.1s ease both',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 800,
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: '#f4f5fa',
              margin: '0 0 0.625rem',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            How can ATS help you today?
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '1rem',
              color: 'var(--on-midnight-muted)',
              lineHeight: 1.6,
            }}
          >
            Describe your situation in 1–2 sentences — we'll handle the rest.
          </p>
        </div>

        {/* Hero input with rotating glow */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            animation: 'hero-fade-up 0.5s 0.2s ease both',
          }}
        >
          <HeroInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            inputRef={inputRef}
          />
        </div>

        {/* Horizontal chips */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '720px',
            width: '100%',
            marginTop: '1.25rem',
            animation: 'hero-fade-up 0.5s 0.35s ease both',
            gap: '0.625rem',
          }}
        >
          {activeSubMenu !== null && (
            <button
              onClick={() => setActiveSubMenu(null)}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-manrope)',
                fontSize: '0.8125rem',
                color: 'var(--on-midnight-muted)',
                padding: '0.25rem 0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f4f5fa' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--on-midnight-muted)' }}
            >
              ← Back
            </button>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
            {(activeSubMenu === 'tools' ? TOOLS_CHIPS : activeSubMenu === 'ideas' ? IDEAS_CHIPS : INITIAL_CHIPS).map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  if ('subMenu' in chip && chip.subMenu != null) {
                    setActiveSubMenu(chip.subMenu)
                  } else if ('message' in chip) {
                    sendMessage(chip.message)
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4375rem',
                  padding: '0.5rem 0.875rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  color: 'var(--on-midnight-muted)',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)'
                  e.currentTarget.style.color = '#f4f5fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'var(--on-midnight-muted)'
                }}
              >
                <chip.icon size={13} aria-hidden="true" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── CHAT ───────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, background: '#0a0d14', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            maxWidth: '700px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              <MessageBubble msg={msg} isStreaming={streaming && i === messages.length - 1} />

              {/* Suggestion chips */}
              {msg.role === 'assistant' && i === messages.length - 1 && !streaming && suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.875rem', paddingLeft: '14px' }}>
                  {suggestions.map((s, idx) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      style={{
                        padding: '0.4375rem 0.875rem',
                        fontSize: '0.8125rem',
                        color: 'var(--on-midnight-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-manrope)',
                        fontWeight: 500,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                        animation: `chip-slide-up 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${idx * 0.05}s both`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)'
                        e.currentTarget.style.color = '#f4f5fa'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.color = 'var(--on-midnight-muted)'
                      }}
                    >
                      {s}
                    </button>
                  ))}

                  {readyToSubmit && (
                    <button
                      onClick={() => setPhase('confirming')}
                      style={{
                        padding: '0.4375rem 1rem',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-manrope)',
                        background: 'var(--ats-indigo)',
                        borderLeft: '2px solid var(--wfg-gold)',
                        borderRadius: '999px',
                        border: 'none',
                        animation: `chip-slide-up 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${suggestions.length * 0.05}s both`,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      Submit my request to ATS →
                    </button>
                  )}
                </div>
              )}

              {/* Confirm card */}
              {msg.role === 'assistant' && i === messages.length - 1 && !streaming && phase === 'confirming' && (
                <ConfirmCard
                  extracted={extracted}
                  error={submitError}
                  loading={isSubmitting}
                  onConfirm={handleSubmit}
                  onAddMore={() => setPhase('chatting')}
                />
              )}
            </div>
          ))}

          {/* Typing dots */}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <div style={{ display: 'flex', gap: '4px', padding: '0.25rem 0', paddingLeft: '14px' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(99,102,241,0.6)',
                    display: 'inline-block',
                    animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat input bar */}
      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        onKeyDown={handleKeyDown}
        disabled={streaming || isSubmitting}
        inputRef={inputRef}
      />
    </div>
  )
}

// ── Message Bubble ──────────────────────────────────────────
function MessageBubble({ msg, isStreaming }: { msg: DiscoveryMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '78%',
            padding: '0.625rem 1rem',
            borderRadius: '18px 18px 4px 18px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.2)',
            fontSize: '0.9375rem',
            color: '#e8eaf6',
            lineHeight: 1.65,
            fontFamily: 'var(--font-manrope)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '85%',
          borderLeft: '2px solid rgba(99,102,241,0.3)',
          paddingLeft: '12px',
          fontSize: '0.9375rem',
          color: '#cdd0e8',
          lineHeight: 1.75,
          fontFamily: 'var(--font-manrope)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content || (isStreaming ? <TypingDots /> : null)}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', height: '22px' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.5)',
            display: 'inline-block',
            animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  )
}

// ── Confirm Card ──────────────────────────────────────────────
function ConfirmCard({
  extracted, error, loading, onConfirm, onAddMore,
}: {
  extracted: DiscoveryExtracted
  error: string
  loading: boolean
  onConfirm: () => void
  onAddMore: () => void
}) {
  const fields = [
    { label: 'Agency',          value: extracted.agency_name },
    { label: 'Category',        value: extracted.category },
    { label: 'Type',            value: extracted.request_type?.replace(/_/g, ' ') },
    { label: 'Closing Software',value: extracted.closing_software },
    { label: 'Team Size',       value: extracted.team_size },
    { label: 'Region',          value: extracted.region },
    { label: 'Topics',          value: extracted.topics?.join(', ') },
    { label: 'Situation',       value: extracted.situation },
  ].filter((f) => f.value)

  const personnelNames = extracted.key_personnel?.map((p) => p.name).join(', ')

  return (
    <div
      style={{
        marginTop: '1rem',
        marginLeft: '14px',
        padding: '1.25rem',
        background: '#111827',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.07)',
        animation: 'chip-slide-up 0.25s ease both',
      }}
    >
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-midnight-muted)', marginBottom: '0.875rem', fontFamily: 'var(--font-manrope)' }}>
        Request Summary
      </div>

      {fields.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {fields.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--on-midnight-muted)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#f4f5fa', fontWeight: 500, fontFamily: 'var(--font-manrope)' }}>{value}</span>
            </div>
          ))}
          {personnelNames && (
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--on-midnight-muted)', minWidth: '110px', flexShrink: 0 }}>Key Personnel</span>
              <span style={{ color: '#f4f5fa', fontWeight: 500, fontFamily: 'var(--font-manrope)' }}>{personnelNames}</span>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--on-midnight-muted)', marginBottom: '1.25rem' }}>
          Conversation will be submitted as transcript.
        </p>
      )}

      {error && <p style={{ fontSize: '0.8125rem', color: '#f87171', marginBottom: '0.75rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ padding: '0 1.25rem', height: '40px', background: loading ? '#2d3748' : 'var(--ats-indigo)', color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s' }}
        >
          {loading ? 'Submitting…' : 'Submit my request →'}
        </button>
        <button
          onClick={onAddMore}
          disabled={loading}
          style={{ padding: '0 1.25rem', height: '40px', background: 'transparent', color: 'var(--on-midnight-muted)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f4f5fa' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--on-midnight-muted)' }}
        >
          Add more context
        </button>
      </div>
    </div>
  )
}

// ── Hero Input (idle state) — rotating glow border ────────────
function HeroInput({
  value, onChange, onSend, onKeyDown, disabled, inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onSend: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const [focused, setFocused] = useState(false)
  const [everFocused, setEverFocused] = useState(false)
  const hasContent = value.trim().length > 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Indigo ambient orb — drifts slowly, barely visible */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-60px',
          left: '-8%',
          width: '440px',
          height: '180px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'drift-1 14s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Gold accent orb — offset timing, opposite drift */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '10px',
          right: '-6%',
          width: '280px',
          height: '140px',
          background: 'radial-gradient(ellipse, rgba(201,164,92,0.07) 0%, transparent 70%)',
          filter: 'blur(48px)',
          animation: 'drift-2 19s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Border wrapper — clips the rotating gradient to just the border strip */}
      <div
        style={{
          position: 'relative',
          borderRadius: '20px',
          padding: '1.5px',
          overflow: 'hidden',
        }}
      >
        {/* Rotating gradient — fills the wrapper, creates the animated border */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.95) 25deg, rgba(201,164,92,0.6) 70deg, transparent 130deg, transparent 190deg, rgba(99,102,241,0.7) 270deg, transparent 340deg, transparent 360deg)',
            animation: 'rotate-glow 5s linear infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Actual input surface */}
        <div
          style={{
            position: 'relative',
            background: '#0d1117',
            borderRadius: '18.5px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 0.875rem 1rem 1.375rem',
          }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { setFocused(true); setEverFocused(true) }}
            onBlur={() => setFocused(false)}
            placeholder="Describe your situation…"
            rows={1}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-manrope)',
              fontSize: '1rem',
              color: '#f4f5fa',
              lineHeight: 1.55,
              minHeight: '26px',
              maxHeight: '160px',
              overflowY: 'auto',
              paddingTop: '2px',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`
            }}
          />

          {/* Send button */}
          <button
            onClick={() => onSend(value)}
            disabled={!hasContent || disabled}
            aria-label="Send message"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: 'none',
              background: hasContent && !disabled
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : 'rgba(255,255,255,0.07)',
              color: hasContent && !disabled ? '#ffffff' : 'rgba(255,255,255,0.22)',
              cursor: hasContent && !disabled ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s, color 0.2s, transform 0.1s, box-shadow 0.2s',
              boxShadow: hasContent && !disabled ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.88)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.6875rem',
          color: 'var(--on-midnight-subtle)',
          margin: '0.5rem 0 0',
          opacity: everFocused ? 1 : 0,
          transition: 'opacity 0.4s',
          pointerEvents: 'none',
        }}
      >
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ── Chat Input Bar (in-conversation, compact) ─────────────────
function ChatInputBar({
  value, onChange, onSend, onKeyDown, disabled, inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onSend: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const [focused, setFocused] = useState(false)
  const hasContent = value.trim().length > 0

  return (
    <div style={{ padding: '0.875rem 1.5rem 1rem', background: '#0a0d14', flexShrink: 0 }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.625rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '16px',
            padding: '0.625rem 0.625rem 0.625rem 1rem',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Type a message…"
            rows={1}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-manrope)',
              fontSize: '0.9375rem',
              color: '#f4f5fa',
              lineHeight: 1.5,
              minHeight: '24px',
              maxHeight: '160px',
              overflowY: 'auto',
              paddingTop: '0.1875rem',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`
            }}
          />
          <button
            onClick={() => onSend(value)}
            disabled={!hasContent || disabled}
            aria-label="Send message"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: 'none',
              background: hasContent && !disabled
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : 'rgba(255,255,255,0.06)',
              color: hasContent && !disabled ? '#ffffff' : 'rgba(255,255,255,0.2)',
              cursor: hasContent && !disabled ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s, color 0.2s, transform 0.1s',
              boxShadow: hasContent && !disabled ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.88)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--on-midnight-subtle)', margin: '0.4375rem 0 0' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
