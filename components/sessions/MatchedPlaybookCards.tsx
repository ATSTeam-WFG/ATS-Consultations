'use client'

import Link from 'next/link'
import type { PlaybookMatch } from '@/lib/types'
import { BookOpen } from 'lucide-react'

interface MatchedPlaybookCardsProps {
  matches: PlaybookMatch[]
}

export function MatchedPlaybookCards({ matches }: MatchedPlaybookCardsProps) {
  if (matches.length === 0) return null

  return (
    <div className="ats-card">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
        Matched Playbooks ({matches.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {matches.map(({ playbook, match_score, match_reason }) => (
          <div
            key={playbook.id}
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: 'var(--background)',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.375rem',
                background: 'var(--ats-blue-light)',
                color: 'var(--ats-blue-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <Link
                  href={`/playbooks/${playbook.id}`}
                  style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--foreground)' }}
                >
                  {playbook.title}
                </Link>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    background: 'var(--ats-blue-light)',
                    color: 'var(--ats-blue-dark)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {Math.round(match_score * 100)}% match
                </span>
              </div>
              {match_reason && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{match_reason}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {playbook.trigger_tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag-pill">{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
