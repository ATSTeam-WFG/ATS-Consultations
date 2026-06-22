import Link from 'next/link'
import { BookOpen } from 'lucide-react'

interface TopPlaybooksProps {
  playbooks: { id: string; title: string; usage_count: number }[]
}

export function TopPlaybooks({ playbooks }: TopPlaybooksProps) {
  if (playbooks.length === 0) {
    return (
      <div className="ats-card">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Top Playbooks</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No playbook usage yet.</p>
      </div>
    )
  }

  return (
    <div className="ats-card">
      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.875rem' }}>Top Playbooks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {playbooks.map((pb, i) => (
          <div key={pb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '1.375rem',
                height: '1.375rem',
                borderRadius: '50%',
                background: i === 0 ? 'var(--ats-blue)' : 'var(--muted)',
                color: i === 0 ? '#fff' : 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <Link
              href={`/playbooks/${pb.id}`}
              style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: 'var(--foreground)' }}
            >
              {pb.title}
            </Link>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              {pb.usage_count} uses
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
