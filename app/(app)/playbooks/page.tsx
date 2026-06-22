import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { PlaybookCard } from '@/components/playbooks/PlaybookCard'
import type { Playbook } from '@/lib/types'

export default async function PlaybooksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: playbooks } = await db
    .from('playbooks')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Playbooks</h1>
        <Link
          href="/playbooks/new"
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
          New playbook
        </Link>
      </div>

      <div className="page-body">
        {!playbooks || playbooks.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No playbooks yet</p>
              <p style={{ fontSize: '0.875rem' }}>Create playbooks to match against session analysis results.</p>
              <Link
                href="/playbooks/new"
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
                Create playbook
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {(playbooks as Playbook[]).map((pb) => (
              <PlaybookCard key={pb.id} playbook={pb} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
