import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { IntakeQuestionsEditor } from '@/components/settings/IntakeQuestionsEditor'
import type { IntakeQuestion } from '@/lib/types'

export default async function IntakeSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceRoleClient()
  const { data: questions } = await db
    .from('intake_questions')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>Intake Questions</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>
            Manage the questions shown to agents in the discovery form.
          </p>
        </div>
      </div>
      <IntakeQuestionsEditor initialQuestions={(questions ?? []) as IntakeQuestion[]} />
    </div>
  )
}
