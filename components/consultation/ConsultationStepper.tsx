'use client'

import { useState } from 'react'
import { SuccessState } from './SuccessState'
import type { TitleAgentCategory } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────
interface ContactRow {
  name: string
  role: string
  email: string
}

interface StepperState {
  // Step 1
  agency_name: string
  category: TitleAgentCategory | ''
  region: string
  team_size: string
  // Step 2
  rep_name: string
  rep_email: string
  contacts: ContactRow[]
  // Step 3
  topics: string[]
  situation: string
  notes: string
  // Step 4
  requested_time: string
}

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES: TitleAgentCategory[] = ['UNICORN', 'DIAMOND', 'GOLD', 'SILVER']

const CATEGORY_COLORS: Record<TitleAgentCategory, string> = {
  UNICORN: '#7c3aed',
  DIAMOND: '#0ea5e9',
  GOLD: '#c9a45c',
  SILVER: '#6b7280',
}

const REGIONS = [
  'Pacific Northwest',
  'Southwest',
  'Mountain West',
  'Midwest',
  'Southeast',
  'Northeast',
  'Mid-Atlantic',
  'Texas & Gulf',
  'Other',
]

const TEAM_SIZES = ['1–5', '6–15', '16–30', '31–60', '61–100', '100+']

const TOPICS = [
  'Order Entry',
  'Wire Fraud Prevention',
  'AI Adoption',
  'TPS Automations',
  'CRM & Prospects',
  'Closing Coordination',
  'Reporting & Analytics',
  'Compliance & Policies',
  'Team Capacity',
]

const STEPS = [
  { num: 1, title: 'Your Agency' },
  { num: 2, title: 'Who Should Join' },
  { num: 3, title: 'What You Need' },
  { num: 4, title: 'Scheduling' },
]

// ── Helpers ────────────────────────────────────────────────────
function StepDot({ num, state }: { num: number; state: 'inactive' | 'active' | 'complete' }) {
  return (
    <div
      className={`step-dot ${state}`}
      aria-current={state === 'active' ? 'step' : undefined}
    >
      {state === 'complete' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.5L5 9L9.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span>{num}</span>
      )}
    </div>
  )
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label className="consultation-label">
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
        {!required && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: '6px' }}>(optional)</span>}
      </label>
      {children}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export function ConsultationStepper() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<StepperState>({
    agency_name: '',
    category: '',
    region: '',
    team_size: '',
    rep_name: '',
    rep_email: '',
    contacts: [],
    topics: [],
    situation: '',
    notes: '',
    requested_time: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof StepperState>(key: K, value: StepperState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addContact() {
    setForm((prev) => ({ ...prev, contacts: [...prev.contacts, { name: '', role: '', email: '' }] }))
  }

  function updateContact(i: number, field: keyof ContactRow, value: string) {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    }))
  }

  function removeContact(i: number) {
    setForm((prev) => ({ ...prev, contacts: prev.contacts.filter((_, idx) => idx !== i) }))
  }

  function toggleTopic(t: string) {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.includes(t) ? prev.topics.filter((x) => x !== t) : [...prev.topics, t],
    }))
  }

  function canAdvance(): boolean {
    if (step === 1) return !!form.agency_name.trim() && !!form.category
    if (step === 2) return !!form.rep_name.trim() && !!form.rep_email.trim()
    return true
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  function handleNext() {
    if (!canAdvance()) return
    if (step < 4) setStep((s) => s + 1)
    else handleSubmit()
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: form.agency_name,
          category: form.category,
          region: form.region || undefined,
          team_size: form.team_size || undefined,
          rep_name: form.rep_name || undefined,
          rep_email: form.rep_email || undefined,
          contacts: form.contacts.filter((c) => c.name || c.email),
          topics: form.topics,
          situation: form.situation || undefined,
          notes: form.notes || undefined,
          requested_time: form.requested_time || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <SuccessState agencyName={form.agency_name} repName={form.rep_name} />
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      {/* ── Step indicator bar ── */}
      <div
        style={{
          padding: '1.5rem 2rem 1.25rem',
          borderBottom: '1px solid var(--surface-border)',
          background: 'var(--surface-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : undefined }}>
              {/* Dot + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <StepDot
                  num={s.num}
                  state={s.num < step ? 'complete' : s.num === step ? 'active' : 'inactive'}
                />
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: s.num === step ? 700 : 500,
                    color: s.num === step ? '#111827' : '#9ca3af',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-manrope)',
                  }}
                >
                  {s.title}
                </span>
              </div>
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: s.num < step
                      ? 'var(--ats-indigo)'
                      : s.num === 1
                      ? 'var(--wfg-gold)'
                      : '#e5e7eb',
                    marginBottom: '22px',
                    marginLeft: '8px',
                    marginRight: '8px',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content ── */}
      <div
        style={{ padding: '2rem', animation: 'step-slide 0.25s ease both' }}
        key={step}
      >
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && (
          <Step2
            form={form}
            set={set}
            addContact={addContact}
            updateContact={updateContact}
            removeContact={removeContact}
          />
        )}
        {step === 3 && <Step3 form={form} set={set} toggleTopic={toggleTopic} />}
        {step === 4 && <Step4 form={form} set={set} />}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '0 2rem', marginTop: '-0.5rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── Nav footer ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderTop: '1px solid var(--surface-border)',
          background: 'var(--surface-subtle)',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontFamily: 'var(--font-manrope)' }}>
          Step {step} of {STEPS.length}
        </span>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {step > 1 && (
            <button className="btn-ghost" onClick={handleBack} type="button">
              ← Back
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleNext}
            type="button"
            disabled={!canAdvance() || submitting}
          >
            {step < 4 ? 'Continue →' : submitting ? 'Submitting…' : 'Submit Request →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Your Agency ────────────────────────────────────────
function Step1({
  form,
  set,
}: {
  form: StepperState
  set: <K extends keyof StepperState>(key: K, val: StepperState[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: '1.125rem', margin: '0 0 4px', color: '#111827' }}>
          Your Agency
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Tell us about the agency requesting a consultation.
        </p>
      </div>

      <FieldGroup label="Agency Name" required>
        <input
          className="consultation-input"
          value={form.agency_name}
          onChange={(e) => set('agency_name', e.target.value)}
          placeholder="e.g. Sunrise Title Group"
          autoFocus
        />
      </FieldGroup>

      <FieldGroup label="Agency Level" required>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {CATEGORIES.map((cat) => {
            const selected = form.category === cat
            const color = CATEGORY_COLORS[cat]
            return (
              <label
                key={cat}
                className={`category-pill${selected ? ' selected' : ''}`}
                style={selected ? { borderColor: color, background: `${color}18`, color } : {}}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selected}
                  onChange={() => set('category', cat)}
                  style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: '-1px' }}
                />
                {cat}
              </label>
            )
          })}
        </div>
      </FieldGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <FieldGroup label="Region">
          <select
            className="consultation-input"
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select region…</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Team Size">
          <select
            className="consultation-input"
            value={form.team_size}
            onChange={(e) => set('team_size', e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select size…</option>
            {TEAM_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FieldGroup>
      </div>
    </div>
  )
}

// ── Step 2: Who Should Join ────────────────────────────────────
function Step2({
  form,
  set,
  addContact,
  updateContact,
  removeContact,
}: {
  form: StepperState
  set: <K extends keyof StepperState>(key: K, val: StepperState[K]) => void
  addContact: () => void
  updateContact: (i: number, field: keyof ContactRow, value: string) => void
  removeContact: (i: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: '1.125rem', margin: '0 0 4px', color: '#111827' }}>
          Who Should Join
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Add the WFG rep and any agency contacts who should attend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <FieldGroup label="Rep Name" required>
          <input
            className="consultation-input"
            value={form.rep_name}
            onChange={(e) => set('rep_name', e.target.value)}
            placeholder="Your name"
            autoFocus
          />
        </FieldGroup>
        <FieldGroup label="Rep Email" required>
          <input
            className="consultation-input"
            type="email"
            value={form.rep_email}
            onChange={(e) => set('rep_email', e.target.value)}
            placeholder="you@wfgtitle.com"
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Key Contacts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {form.contacts.map((contact, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '0.375rem',
                alignItems: 'center',
              }}
            >
              <input
                className="consultation-input"
                value={contact.name}
                onChange={(e) => updateContact(i, 'name', e.target.value)}
                placeholder="Name"
              />
              <input
                className="consultation-input"
                value={contact.role}
                onChange={(e) => updateContact(i, 'role', e.target.value)}
                placeholder="Role"
              />
              <input
                className="consultation-input"
                type="email"
                value={contact.email}
                onChange={(e) => updateContact(i, 'email', e.target.value)}
                placeholder="Email"
              />
              <button
                type="button"
                onClick={() => removeContact(i)}
                aria-label="Remove contact"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: '1.5px solid var(--surface-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '1rem',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addContact}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: '0.875rem',
              color: 'var(--ats-indigo)',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'var(--font-manrope)',
            }}
          >
            + Add contact
          </button>
        </div>
      </FieldGroup>
    </div>
  )
}

// ── Step 3: What You Need ──────────────────────────────────────
function Step3({
  form,
  set,
  toggleTopic,
}: {
  form: StepperState
  set: <K extends keyof StepperState>(key: K, val: StepperState[K]) => void
  toggleTopic: (t: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: '1.125rem', margin: '0 0 4px', color: '#111827' }}>
          What You Need
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Select the topics most relevant to your consultation.
        </p>
      </div>

      <FieldGroup label="Topics">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`topic-chip${form.topics.includes(t) ? ' selected' : ''}`}
              onClick={() => toggleTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Current Situation">
        <textarea
          className="consultation-textarea"
          value={form.situation}
          onChange={(e) => set('situation', e.target.value)}
          placeholder="Describe your agency's current challenges or goals…"
          rows={4}
        />
      </FieldGroup>

      <FieldGroup label="Additional Notes">
        <textarea
          className="consultation-textarea"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything else we should know before the session…"
          rows={3}
        />
      </FieldGroup>
    </div>
  )
}

// ── Step 4: Scheduling ─────────────────────────────────────────
function Step4({
  form,
  set,
}: {
  form: StepperState
  set: <K extends keyof StepperState>(key: K, val: StepperState[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: '1.125rem', margin: '0 0 4px', color: '#111827' }}>
          Scheduling
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Let us know when works best — we&apos;ll confirm the exact time.
        </p>
      </div>

      <FieldGroup label="Preferred Time Window">
        <input
          className="consultation-input"
          value={form.requested_time}
          onChange={(e) => set('requested_time', e.target.value)}
          placeholder="e.g. Weekday mornings, any Thursday in March"
          autoFocus
        />
      </FieldGroup>

      {/* Summary card */}
      <div
        style={{
          background: 'var(--surface-subtle)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-manrope)',
          }}
        >
          Review Summary
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SummaryRow label="Agency" value={form.agency_name} />
          <SummaryRow label="Level" value={form.category} />
          {form.region && <SummaryRow label="Region" value={form.region} />}
          {form.team_size && <SummaryRow label="Team Size" value={form.team_size} />}
          <SummaryRow label="Rep" value={[form.rep_name, form.rep_email].filter(Boolean).join(' · ')} />
          {form.contacts.length > 0 && (
            <SummaryRow label="Contacts" value={`${form.contacts.length} added`} />
          )}
          {form.topics.length > 0 && (
            <SummaryRow label="Topics" value={form.topics.join(', ')} />
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
      <span style={{ color: '#9ca3af', minWidth: '80px', flexShrink: 0, fontFamily: 'var(--font-manrope)' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
