import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { AnalysisDisplay } from '@/components/sessions/AnalysisDisplay'
import { MatchedPlaybookCards } from '@/components/sessions/MatchedPlaybookCards'
import { AnalyzeTrigger } from '@/components/sessions/AnalyzeTrigger'
import type { SessionAnalysis, Playbook, PlaybookMatch } from '@/lib/types'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: session, error } = await db
    .from('sessions')
    .select('*, agents(name, agency_name, category), session_analysis(*)')
    .eq('id', id)
    .single()

  if (error || !session) notFound()

  const analysis = (session.session_analysis as SessionAnalysis | null)

  // Fetch matched playbooks if analysis has IDs
  let playbookMatches: PlaybookMatch[] = []
  if (analysis?.matched_playbook_ids?.length) {
    const { data: playbooks } = await db
      .from('playbooks')
      .select('*')
      .in('id', analysis.matched_playbook_ids)

    if (playbooks) {
      playbookMatches = playbooks.map((pb: Playbook) => ({
        playbook: pb,
        match_score: 0.8,
        match_reason: 'Matched based on problem tags',
      }))
    }
  }

  const agent = session.agents as { name: string; agency_name?: string; category?: string } | null

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/sessions" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>
            Sessions
          </Link>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <h1 className="page-title">
            {new Date(session.session_date).toLocaleDateString()} — {agent?.name ?? 'Session'}
          </h1>
        </div>
        <span className={`badge badge-${session.status}`}>{session.status}</span>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Meta */}
        <div className="ats-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Title Agent</div>
            <div style={{ fontWeight: 500 }}>
              <Link href={`/agents/${session.agent_id}`} style={{ textDecoration: 'none', color: 'var(--ats-blue)' }}>
                {agent?.name}
              </Link>
            </div>
            {agent?.agency_name && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{agent.agency_name}</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Date</div>
            <div style={{ fontWeight: 500 }}>{new Date(session.session_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Duration</div>
            <div style={{ fontWeight: 500 }}>{session.duration_minutes ? `${session.duration_minutes} min` : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Session Type</div>
            <div style={{ fontWeight: 500 }}>
              {session.session_type === 'walk_in' ? 'Walk In' : 'Zoom Call'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Rep</div>
            <div style={{ fontWeight: 500 }}>{session.rep_name ?? '—'}</div>
          </div>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="ats-card">
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
              Session Notes
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{session.notes}</p>
          </div>
        )}

        {/* AI Analysis section */}
        {!analysis && (
          <AnalyzeTrigger sessionId={id} hasTranscript={!!session.transcript_text || !!session.transcript_url} />
        )}

        {analysis && <AnalysisDisplay analysis={analysis} />}

        {/* Matched playbooks */}
        {playbookMatches.length > 0 && <MatchedPlaybookCards matches={playbookMatches} />}
      </div>
    </>
  )
}
