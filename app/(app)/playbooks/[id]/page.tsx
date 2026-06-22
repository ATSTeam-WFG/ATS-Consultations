import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { Pencil, Clock, BarChart3, CheckCircle2 } from 'lucide-react'
import type { Playbook, PlaybookStep } from '@/lib/types'

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: playbook, error } = await db
    .from('playbooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !playbook) notFound()

  const pb = playbook as Playbook

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/playbooks" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>
            Playbooks
          </Link>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <h1 className="page-title">{pb.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={`badge badge-${pb.status}`}>{pb.status}</span>
          <Link
            href={`/playbooks/${id}/edit`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              color: 'var(--foreground)',
            }}
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Meta */}
        <div className="ats-card">
          {pb.description && (
            <p style={{ fontSize: '0.9375rem', marginBottom: '1rem', lineHeight: 1.6 }}>{pb.description}</p>
          )}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {pb.difficulty && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                <BarChart3 size={14} />
                {pb.difficulty} difficulty
              </div>
            )}
            {pb.estimated_weeks && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                <Clock size={14} />
                {pb.estimated_weeks} weeks
              </div>
            )}
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {pb.usage_count} uses
            </div>
          </div>

          {pb.trigger_tags.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pb.trigger_tags.map((tag) => (
                <span key={tag} className="tag-pill">{tag.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        {pb.steps?.length > 0 && (
          <div className="ats-card">
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Steps ({pb.steps.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {pb.steps.map((step: PlaybookStep, i: number) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '0.875rem',
                    borderBottom: i < pb.steps.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      background: 'var(--ats-blue)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {step.order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{step.title}</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.375rem' }}>{step.description}</p>
                    {step.duration_days && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        <Clock size={12} />
                        {step.duration_days} days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected outcome */}
        {pb.expected_outcome && (
          <div className="ats-card" style={{ background: 'var(--ats-blue-light)', borderColor: 'var(--ats-blue)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--ats-blue-dark)', flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ats-blue-dark)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Expected Outcome</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--ats-blue-dark)' }}>{pb.expected_outcome}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
