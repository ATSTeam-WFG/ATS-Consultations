import Link from 'next/link'
import type { Agent, TitleAgentCategory } from '@/lib/types'

const CATEGORY_TIER: Record<TitleAgentCategory, string> = {
  UNICORN: 'tier-unicorn',
  DIAMOND: 'tier-diamond',
  GOLD: 'tier-gold',
  SILVER: 'tier-silver',
}

interface AgentCardProps {
  agent: Agent & { sessions?: { count: number }[] }
}

export function AgentCard({ agent }: AgentCardProps) {
  const sessionCount = agent.sessions?.[0]?.count ?? 0

  return (
    <Link
      href={`/agents/${agent.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="ats-card"
        style={{
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          borderColor: 'var(--border)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ats-blue)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              background: 'var(--ats-blue-light)',
              color: 'var(--ats-blue-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{agent.name}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
          {agent.agency_name}
        </div>
        {agent.category && (
          <span className={`tier-mark ${CATEGORY_TIER[agent.category]}`}>
            {agent.category}
          </span>
        )}
      </div>
    </Link>
  )
}
