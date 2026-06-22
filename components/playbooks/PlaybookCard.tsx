import Link from 'next/link'
import type { Playbook } from '@/lib/types'
import { BookOpen, Clock, BarChart3 } from 'lucide-react'

interface PlaybookCardProps {
  playbook: Playbook
}

export function PlaybookCard({ playbook }: PlaybookCardProps) {
  return (
    <Link href={`/playbooks/${playbook.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        className="ats-card"
        style={{ cursor: 'pointer', transition: 'border-color 0.15s', height: '100%' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ats-blue)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--ats-blue-light)',
              color: 'var(--ats-blue-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={16} />
          </div>
          <span className={`badge badge-${playbook.status}`}>{playbook.status}</span>
        </div>

        <div style={{ fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.9375rem' }}>{playbook.title}</div>
        {playbook.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            {playbook.description.slice(0, 100)}{playbook.description.length > 100 ? '...' : ''}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {playbook.trigger_tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill">{tag.replace(/_/g, ' ')}</span>
          ))}
          {playbook.trigger_tags.length > 3 && (
            <span className="tag-pill">+{playbook.trigger_tags.length - 3}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          {playbook.estimated_weeks && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              {playbook.estimated_weeks}w
            </span>
          )}
          {playbook.difficulty && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <BarChart3 size={12} />
              {playbook.difficulty}
            </span>
          )}
          <span>{playbook.usage_count} uses</span>
        </div>
      </div>
    </Link>
  )
}
