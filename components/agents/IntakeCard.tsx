'use client'

import { useState } from 'react'
import type { IntakeToken, AgentIntake } from '@/lib/types'

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

interface IntakeCardProps {
  agentId: string
  initialToken: IntakeToken | null
  initialIntake: AgentIntake | null
}

export function IntakeCard({ agentId, initialToken, initialIntake }: IntakeCardProps) {
  const [token, setToken] = useState<IntakeToken | null>(initialToken)
  const [intake] = useState<AgentIntake | null>(initialIntake)
  const [intakeUrl, setIntakeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const generateToken = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/intake-token`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as { token: string; url: string }
      setToken({ id: '', token: data.token, agent_id: agentId, created_by: '', submitted_at: null, created_at: new Date().toISOString() })
      setIntakeUrl(data.url)
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    const url = intakeUrl ?? (token ? `${window.location.origin}/intake/${token.token}` : null)
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayUrl = intakeUrl ?? (token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/intake/${token.token}` : null)

  // State C: submitted
  if (intake) {
    const r = intake.responses
    return (
      <div className="ats-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pre-Consultation Intake</div>
          <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.375rem' }}>
            Submitted {new Date(intake.submitted_at).toLocaleDateString()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {r.monthly_volume && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.2rem' }}>Monthly Volume</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.monthly_volume} transactions</div>
            </div>
          )}
          {r.team_size && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.2rem' }}>Team Size</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.team_size}</div>
            </div>
          )}
          {r.current_software?.length ? (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.2rem' }}>Current Software</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.current_software.join(', ')}</div>
            </div>
          ) : null}
        </div>

        {r.challenge_areas?.length ? (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Challenge Areas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {r.challenge_areas.map(tag => (
                <span key={tag} className="tag-pill">{PROBLEM_TAG_LABELS[tag] ?? tag}</span>
              ))}
            </div>
          </div>
        ) : null}

        {(r.success_looks_like || r.additional_context) && (
          <div>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ fontSize: '0.8125rem', color: 'var(--ats-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {expanded ? 'Hide details' : 'Show goals & context'}
            </button>
            {expanded && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {r.success_looks_like && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Success Looks Like</div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{r.success_looks_like}</div>
                  </div>
                )}
                {r.additional_context && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Additional Context</div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{r.additional_context}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={generateToken}
            disabled={loading}
            style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', background: 'none', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: 'pointer' }}
          >
            {loading ? 'Generating...' : 'Resend Link'}
          </button>
        </div>
      </div>
    )
  }

  // State A: no token yet
  if (!token) {
    return (
      <div className="ats-card">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pre-Consultation Intake</div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
          Send a discovery link to this agent before your first consultation.
        </p>
        <button
          onClick={generateToken}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Generate Intake Link'}
        </button>
      </div>
    )
  }

  // State B: token exists, not submitted
  return (
    <div className="ats-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pre-Consultation Intake</div>
        <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b', border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.375rem' }}>
          Awaiting response
        </span>
      </div>

      {displayUrl && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          marginBottom: '0.75rem',
          overflow: 'hidden',
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {displayUrl}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={copyUrl}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={generateToken}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : 'Regenerate'}
        </button>
      </div>
    </div>
  )
}
