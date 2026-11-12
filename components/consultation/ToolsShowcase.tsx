'use client'

import { Zap, FileText, Users, Shield, Bot, Star } from 'lucide-react'

const TOOLS = [
  {
    num: '01',
    icon: Zap,
    name: 'TPS Automations',
    desc: 'Automate title production workflows end-to-end. Eliminate manual order entry, reduce cycle times, and free your team to focus on complex transactions.',
  },
  {
    num: '02',
    icon: FileText,
    name: 'Order Entry Hub',
    desc: 'Centralized order intake and tracking across all channels. Real-time status visibility from receipt to policy issuance.',
  },
  {
    num: '03',
    icon: Users,
    name: 'CRM Prospects',
    desc: 'Manage and nurture your agency pipeline with automated follow-ups, activity tracking, and relationship health scoring.',
  },
  {
    num: '04',
    icon: Shield,
    name: 'Wire Fraud Prevention',
    desc: 'Real-time wire fraud detection with bank verification protocols and automated callback procedures. CFPB-compliant safeguards built in.',
  },
  {
    num: '05',
    icon: Bot,
    name: 'AI Adoption Suite',
    desc: 'AI-powered tools to accelerate operations — document review, commitment generation, and intelligent exception flagging tailored for title.',
  },
  {
    num: '06',
    icon: Star,
    name: 'ATS Consultation Engine',
    desc: 'White-glove consultation management. Deep session analysis, trend detection, and personalized playbooks for every agency you serve.',
  },
]

export function ToolsShowcase() {
  return (
    <div
      style={{
        flex: 1,
        background: '#0a0d14',
        overflowY: 'auto',
        padding: '3rem 2rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#f4f5fa',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              ATS Tools & Resources
            </h1>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--wfg-gold)',
                flexShrink: 0,
                marginBottom: '-2px',
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--on-midnight-muted)', lineHeight: 1.6 }}>
            The full suite of ATS products and capabilities available to WFG representatives.
          </p>
        </div>

        {/* Tool grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '1rem',
          }}
        >
          {TOOLS.map(({ num, icon: Icon, name, desc }) => (
            <ToolTile key={name} num={num} Icon={Icon} name={name} desc={desc} />
          ))}
        </div>

        {/* Contact footer */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--on-midnight-muted)' }}>
            Have questions about a specific tool?{' '}
            <a
              href="mailto:ATSteam@wfgtitle.com"
              style={{ color: 'var(--wfg-gold)', fontWeight: 600, textDecoration: 'none' }}
            >
              ATSteam@wfgtitle.com
            </a>
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--on-midnight-subtle)' }}>
            © {new Date().getFullYear()} WFG National Title Insurance Company
          </span>
        </div>
      </div>
    </div>
  )
}

function ToolTile({
  num,
  Icon,
  name,
  desc,
}: {
  num: string
  Icon: React.ElementType
  name: string
  desc: string
}) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '1.5rem',
        background: '#0f1520',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = '#131a2e'
        el.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.2)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = '#0f1520'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Watermark number */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '1rem',
          fontFamily: 'var(--font-manrope)',
          fontWeight: 800,
          fontSize: '3.5rem',
          color: '#f4f5fa',
          opacity: 0.04,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {num}
      </span>

      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(99,102,241,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={18} style={{ color: 'var(--ats-indigo)' }} />
      </div>

      {/* Content */}
      <div
        style={{
          fontFamily: 'var(--font-manrope)',
          fontWeight: 700,
          fontSize: '1.0625rem',
          color: '#f4f5fa',
          marginBottom: '0.5rem',
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--on-midnight-muted)',
          lineHeight: 1.6,
        }}
      >
        {desc}
      </div>
    </div>
  )
}
