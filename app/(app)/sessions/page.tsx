import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { SessionsClient } from '@/components/sessions/SessionsClient'

export default async function SessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: sessions } = await db
    .from('sessions')
    .select('*, agents(name, agency_name), session_analysis(summary)')
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <Link
          href="/sessions/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Plus size={16} />
          <span className="page-header-action-label">Log session</span>
        </Link>
      </div>

      <div className="page-body">
        {!sessions || sessions.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No sessions yet</p>
              <p style={{ fontSize: '0.875rem' }}>Start logging consultation sessions to build your intelligence database.</p>
              <Link
                href="/sessions/new"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--ats-blue)',
                  color: '#fff',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Log first session
              </Link>
            </div>
          </div>
        ) : (
          <SessionsClient initialSessions={sessions} />
        )}
      </div>
    </>
  )
}
