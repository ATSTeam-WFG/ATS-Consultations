'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact, IntakeQuestion, IntakeResponses } from '@/lib/types'

interface IntakeFormProps {
  token: string
  agentName: string
  agencyName: string
  wfgRep: string | null
  contacts: Contact[]
  questions: IntakeQuestion[]
}

export function IntakeForm({ token, agentName, agencyName, wfgRep, contacts, questions }: IntakeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [responses, setResponses] = useState<IntakeResponses>({
    monthly_volume: undefined,
    team_size: undefined,
    current_software: [],
    challenge_areas: [],
    biggest_bottleneck: '',
    success_looks_like: '',
    additional_context: '',
    preferred_contact: contacts[0]
      ? { name: contacts[0].name, email: contacts[0].email }
      : { name: '', email: '' },
  })
  const [softwareOtherText, setSoftwareOtherText] = useState('')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)

  // step 0 = welcome, steps 1..N = dynamic questions, step N+1 = done/submit (built into last question)
  const totalSteps = questions.length + 1 // 0 = welcome, 1..N = questions

  const navigate = useCallback((next: number) => {
    setDirection(next > step ? 'forward' : 'back')
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 200)
  }, [step])

  const toggleMultiselect = (key: keyof IntakeResponses, value: string, maxSelect?: number | null) => {
    setResponses(prev => {
      const current = (prev[key] as string[]) ?? []
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((x: string) => x !== value) }
      }
      if (maxSelect && current.length >= maxSelect) return prev
      return { ...prev, [key]: [...current, value] }
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const finalResponses: IntakeResponses = {
        ...responses,
        current_software: [
          ...(responses.current_software?.filter(s => s !== 'Other') ?? []),
          ...(responses.current_software?.includes('Other') && softwareOtherText
            ? [softwareOtherText.trim()]
            : []),
        ],
      }
      const res = await fetch(`/api/intake/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: finalResponses }),
      })
      if (!res.ok) throw new Error('Submission failed')
      router.push(`/intake/${token}/done?agency=${encodeURIComponent(agencyName)}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const progressPct = step === 0 ? 0 : Math.round((step / questions.length) * 100)
  const currentQuestion = step > 0 ? questions[step - 1] : null
  const isLastStep = step === questions.length

  function isNextDisabled(): boolean {
    if (!currentQuestion) return false
    if (currentQuestion.type === 'choice') {
      const val = responses[currentQuestion.key as keyof IntakeResponses]
      return !val
    }
    return false
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 60%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      color: '#f1f5f9',
    }}>
      {/* Progress bar */}
      {step > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 50 }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* Top bar (steps 1+) */}
      {step > 0 && (
        <div style={{
          position: 'fixed',
          top: '3px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 40,
        }}>
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Step {step} of {questions.length}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>{agentName}</div>
            {wfgRep && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WFG Rep: {wfgRep}</div>
            )}
          </div>
        </div>
      )}

      {/* Step content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: step > 0 ? '5rem 1.5rem 7rem' : '2rem 1.5rem',
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateX(${direction === 'forward' ? '-20px' : '20px'})`
            : 'translateX(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {step === 0 && (
          <WelcomeStep
            agentName={agentName}
            agencyName={agencyName}
            wfgRep={wfgRep}
            questionCount={questions.length}
            onStart={() => navigate(1)}
          />
        )}

        {currentQuestion && currentQuestion.type === 'choice' && (
          <ChoiceStep
            title={currentQuestion.title}
            subtitle={currentQuestion.subtitle ?? ''}
            options={(currentQuestion.options ?? []).map(o => o.label)}
            values={(currentQuestion.options ?? []).map(o => o.value)}
            selected={responses[currentQuestion.key as keyof IntakeResponses] as string | undefined}
            onSelect={v => setResponses(p => ({ ...p, [currentQuestion.key]: v }))}
          />
        )}

        {currentQuestion && currentQuestion.type === 'multiselect' && currentQuestion.key === 'current_software' && (
          <SoftwareStep
            options={(currentQuestion.options ?? []).map(o => o.label)}
            selected={responses.current_software ?? []}
            onToggle={v => toggleMultiselect('current_software', v, currentQuestion.max_select)}
            otherText={softwareOtherText}
            onOtherText={setSoftwareOtherText}
          />
        )}

        {currentQuestion && currentQuestion.type === 'multiselect' && currentQuestion.key !== 'current_software' && (
          <MultiSelectStep
            title={currentQuestion.title}
            subtitle={currentQuestion.subtitle ?? ''}
            options={currentQuestion.options ?? []}
            maxSelect={currentQuestion.max_select}
            selected={(responses[currentQuestion.key as keyof IntakeResponses] as string[]) ?? []}
            onToggle={v => toggleMultiselect(currentQuestion.key as keyof IntakeResponses, v, currentQuestion.max_select)}
          />
        )}

        {currentQuestion && currentQuestion.type === 'text' && (
          <TextStep
            title={currentQuestion.title}
            subtitle={currentQuestion.subtitle ?? ''}
            placeholder="I'd love to walk away with a clear roadmap for..."
            value={(responses[currentQuestion.key as keyof IntakeResponses] as string) ?? ''}
            onChange={v => setResponses(p => ({ ...p, [currentQuestion.key]: v }))}
            minRows={4}
          />
        )}

        {currentQuestion && currentQuestion.type === 'contact' && (
          <FinalStep
            additionalContext={responses.additional_context ?? ''}
            onAdditionalContext={v => setResponses(p => ({ ...p, additional_context: v }))}
            contactName={responses.preferred_contact?.name ?? ''}
            contactEmail={responses.preferred_contact?.email ?? ''}
            onContactName={v => setResponses(p => ({ ...p, preferred_contact: { ...p.preferred_contact!, name: v } }))}
            onContactEmail={v => setResponses(p => ({ ...p, preferred_contact: { ...p.preferred_contact!, email: v } }))}
            error={error}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Bottom navigation (steps 1 to last non-contact, not 0) */}
      {step > 0 && currentQuestion && currentQuestion.type !== 'contact' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          background: 'rgba(13,17,23,0.92)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => navigate(step - 1)}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Back
          </button>
          <button
            onClick={() => navigate(step + 1)}
            disabled={isNextDisabled()}
            style={{
              flex: 2,
              padding: '0.875rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
              opacity: isNextDisabled() ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Contact step bottom nav */}
      {step > 0 && currentQuestion && currentQuestion.type === 'contact' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          background: 'rgba(13,17,23,0.92)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => navigate(step - 1)}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2,
              padding: '0.875rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function WelcomeStep({
  agentName,
  agencyName,
  wfgRep,
  questionCount,
  onStart,
}: {
  agentName: string
  agencyName: string
  wfgRep: string | null
  questionCount: number
  onStart: () => void
}) {
  return (
    <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '2rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '2rem',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        fontSize: '0.8125rem',
        color: '#a5b4fc',
        fontWeight: 500,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
        WFG ATS Consultation Engine
      </div>

      <h1 style={{
        fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
        fontWeight: 700,
        lineHeight: 1.2,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Welcome, {agentName}.
      </h1>

      <p style={{ fontSize: '1.0625rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        ATS is excited to learn more about <strong style={{ color: '#f1f5f9' }}>{agencyName}</strong>.
      </p>
      <p style={{ fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
        This short discovery form helps{wfgRep ? ` ${wfgRep} and ` : ' '}our team understand your workflows before your consultation — so we can make every minute count.
      </p>

      <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '2.5rem' }}>
        {questionCount} quick question{questionCount !== 1 ? 's' : ''} · Takes about 3 minutes
      </p>

      <button
        onClick={onStart}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 2.5rem',
          borderRadius: '0.75rem',
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: '52px',
          boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
        }}
      >
        Get Started →
      </button>
    </div>
  )
}

function ChoiceStep({
  title,
  subtitle,
  options,
  values,
  selected,
  onSelect,
}: {
  title: string
  subtitle: string
  options: string[]
  values: string[]
  selected: string | undefined
  onSelect: (v: string) => void
}) {
  return (
    <div style={{ maxWidth: '560px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {subtitle}
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '2rem', lineHeight: 1.3 }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {options.map((label, i) => {
          const isSelected = selected === values[i]
          return (
            <button
              key={values[i]}
              onClick={() => onSelect(values[i])}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? '#a5b4fc' : '#cbd5e1',
                fontSize: '0.9375rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '52px',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MultiSelectStep({
  title,
  subtitle,
  options,
  maxSelect,
  selected,
  onToggle,
}: {
  title: string
  subtitle: string
  options: { label: string; value: string }[]
  maxSelect: number | null
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div style={{ maxWidth: '620px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {subtitle}
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {title}
      </h2>
      {maxSelect && (
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
          Pick up to {maxSelect}. {selected.length > 0 && <span style={{ color: '#6366f1' }}>{selected.length}/{maxSelect} selected</span>}
        </p>
      )}
      {!maxSelect && (
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>Select all that apply.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
        {options.map(({ label, value }) => {
          const isSelected = selected.includes(value)
          const isDisabled = !isSelected && maxSelect !== null && selected.length >= maxSelect
          return (
            <button
              key={value}
              onClick={() => !isDisabled && onToggle(value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.625rem',
                border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                color: isSelected ? '#a5b4fc' : isDisabled ? '#374151' : '#94a3b8',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SoftwareStep({
  options,
  selected,
  onToggle,
  otherText,
  onOtherText,
}: {
  options: string[]
  selected: string[]
  onToggle: (s: string) => void
  otherText: string
  onOtherText: (v: string) => void
}) {
  return (
    <div style={{ maxWidth: '560px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Current Tools
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        What software does your agency use today?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>Select all that apply.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
        {options.map(s => {
          const isSelected = selected.includes(s)
          return (
            <button
              key={s}
              onClick={() => onToggle(s)}
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.625rem',
                border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? '#a5b4fc' : '#cbd5e1',
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
      {selected.includes('Other') && (
        <input
          type="text"
          placeholder="Which software?"
          value={otherText}
          onChange={e => onOtherText(e.target.value)}
          style={{
            marginTop: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '0.625rem',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#f1f5f9',
            fontSize: '0.9375rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

function TextStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  minRows,
}: {
  title: string
  subtitle: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  minRows: number
}) {
  return (
    <div style={{ maxWidth: '560px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {subtitle}
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.75rem', lineHeight: 1.3 }}>
        {title}
      </h2>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={minRows}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: '#f1f5f9',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function FinalStep({
  additionalContext,
  onAdditionalContext,
  contactName,
  contactEmail,
  onContactName,
  onContactEmail,
  error,
  submitting,
  onSubmit,
}: {
  additionalContext: string
  onAdditionalContext: (v: string) => void
  contactName: string
  contactEmail: string
  onContactName: (v: string) => void
  onContactEmail: (v: string) => void
  error: string | null
  submitting: boolean
  onSubmit: () => void
}) {
  return (
    <div style={{ maxWidth: '560px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Anything Else
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        Last step — almost there.
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
        Anything else you'd like us to know? And confirm the best contact email for follow-up.
      </p>

      <textarea
        placeholder="Any other context, questions, or things you'd like to flag... (optional)"
        value={additionalContext}
        onChange={e => onAdditionalContext(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: '#f1f5f9',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          marginBottom: '1rem',
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.375rem' }}>
            Contact name
          </label>
          <input
            type="text"
            value={contactName}
            onChange={e => onContactName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#f1f5f9',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.375rem' }}>
            Best email for follow-up
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={e => onContactEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#f1f5f9',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.625rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5',
          fontSize: '0.875rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
