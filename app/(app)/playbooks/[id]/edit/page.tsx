import { notFound } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { PlaybookForm } from '@/components/playbooks/PlaybookForm'
import type { Playbook } from '@/lib/types'

export default async function EditPlaybookPage({
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Edit Playbook — {playbook.title}</h1>
      </div>
      <div className="page-body">
        <PlaybookForm initial={playbook as Playbook} playbookId={id} />
      </div>
    </>
  )
}
