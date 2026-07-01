'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact, IntakeResponses } from '@/lib/types'

const PROBLEM_TAG_LABELS: Record<string, string> = {
  order_entry: 'Order Entry & File Opening',
  purchase_sale_agreement: 'Purchase & Sale Agreements',
  closing_coordination: 'Closing Coordination',
  post_closing: 'Post-Closing & Recording',
  remittance: 'Remittance & Disbursement',
  escrow_accounting: 'Escrow Accounting',
  tps_automations: 'Workflow Automations',
  integrations: 'Software Integrations',
  ai_adoption: 'AI Tools & Adoption',
  marketing: 'Marketing & Outreach',
  crm_prospects: 'CRM & Prospecting',
  lender_relations: 'Lender Relationships',
  realtor_relations: 'Realtor Relationships',
  reporting: 'Reporting & Analytics',
  compliance: 'Compliance & Audits',
  wire_fraud_prevention: 'Wire Fraud Prevention',
  policies: 'Policy & Procedure Management',
  title_search: 'Title Search & Examination',
  team_capacity: 'Staffing & Team Capacity',
  client_communication: 'Client Communication',
}

const SOFTWARE_OPTIONS = ['Qualia', 'RamQuest', 'SoftPro', 'ResWare', 'ClosingCorp', 'Other']

interface IntakeFormProps {
  token: string
  agentName: string
  agencyName: string
  wfgRep: string | null
  contacts: Contact[]
}

export function IntakeForm({ token, agentName, agencyName, wfgRep, contacts }: IntakeFormProps) {
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

  const totalSteps = 7

  const navigate = useCallback((next: number) => {
    setDirection(next > step ? 'forward' : 'back')
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 200)
  }, [step])

  const toggleSoftware = (s: string) => {
    setResponses(prev => {
      const current = prev.current_software ?? []
      return {
        ...prev,
        current_software: current.includes(s) ? current.filter(x => x !== s) : [...current, s],
      }
    })
  }

  const toggleChallenge = (tag: string) => {
    setResponses(prev => {
      const current = prev.challenge_areas ?? []
      if (current.includes(tag)) {
        return { ...prev, challenge_areas: current.filter(x => x !== tag) }
      }
      if (current.length >= 5) return prev
      return { ...prev, challenge_areas: [...current, tag] }
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

  const progressPct = step === 0 ? 0 : Math.round((step / (totalSteps - 1)) * 100)

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
            Step {step} of {totalSteps - 1}
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
            onStart={() => navigate(1)}
          />
        )}
        {step === 1 && (
          <ChoiceStep
            title="How many transactions does your agency close monthly?"
            subtitle="Your Volume"
            options={['<25', '25–50', '50–100', '100–250', '250+']}
            values={['<25', '25-50', '50-100', '100-250', '250+']}
            selected={responses.monthly_volume}
            onSelect={v => setResponses(p => ({ ...p, monthly_volume: v }))}
          />
        )}
        {step === 2 && (
          <ChoiceStep
            title="How large is your team?"
            subtitle="Your Team"
            options={['Just me', '2–5 people', '6–15 people', '16–30 people', '30+ people']}
            values={['Solo', '2-5', '6-15', '16-30', '30+']}
            selected={responses.team_size}
            onSelect={v => setResponses(p => ({ ...p, team_size: v }))}
          />
        )}
        {step === 3 && (
          <SoftwareStep
            selected={responses.current_software ?? []}
            onToggle={toggleSoftware}
            otherText={softwareOtherText}
            onOtherText={setSoftwareOtherText}
          />
        )}
        {step === 4 && (
          <ChallengeStep
            selected={responses.challenge_areas ?? []}
            onToggle={toggleChallenge}
          />
        )}
        {step === 5 && (
          <TextStep
            title="What would a successful consultation look like for you?"
            subtitle="Your Goals"
            placeholder="I'd love to walk away with a clear roadmap for..."
            value={responses.success_looks_like ?? ''}
            onChange={v => setResponses(p => ({ ...p, success_looks_like: v }))}
            minRows={4}
          />
        )}
        {step === 6 && (
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

      {/* Bottom navigation (steps 1-5, not 0 or 6) */}
      {step > 0 && step < 6 && (
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
            disabled={
              (step === 1 && !responses.monthly_volume) ||
              (step === 2 && !responses.team_size)
            }
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
              opacity: (
                (step === 1 && !responses.monthly_volume) ||
                (step === 2 && !responses.team_size)
              ) ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 6 bottom nav */}
      {step === 6 && (
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
            onClick={() => navigate(5)}
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
  onStart,
}: {
  agentName: string
  agencyName: string
  wfgRep: string | null
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
        6 quick questions · Takes about 3 minutes
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

function SoftwareStep({
  selected,
  onToggle,
  otherText,
  onOtherText,
}: {
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
        {SOFTWARE_OPTIONS.map(s => {
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

function ChallengeStep({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (tag: string) => void
}) {
  return (
    <div style={{ maxWidth: '620px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Where You Struggle
      </div>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        Where do you feel the most friction day-to-day?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
        Pick up to 5 areas. {selected.length > 0 && <span style={{ color: '#6366f1' }}>{selected.length}/5 selected</span>}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
        {Object.entries(PROBLEM_TAG_LABELS).map(([tag, label]) => {
          const isSelected = selected.includes(tag)
          const isDisabled = !isSelected && selected.length >= 5
          return (
            <button
              key={tag}
              onClick={() => !isDisabled && onToggle(tag)}
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
