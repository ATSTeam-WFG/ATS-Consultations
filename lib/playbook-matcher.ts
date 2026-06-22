import { createServiceRoleClient } from './supabase'
import { matchPlaybooks as matchPlaybooksWithClaude } from './claude'
import type { SessionAnalysis, Playbook, PlaybookMatch } from './types'

export async function matchPlaybooks(
  sessionAnalysis: SessionAnalysis,
  userId: string
): Promise<PlaybookMatch[]> {
  const db = createServiceRoleClient()

  // Fetch published playbooks for this user
  const { data: playbooks, error } = await db
    .from('playbooks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')

  if (error || !playbooks || playbooks.length === 0) return []

  const matches = await matchPlaybooksWithClaude(
    sessionAnalysis.problem_tags,
    null,
    null,
    playbooks as Playbook[]
  )

  if (matches.length === 0) return []

  // Get matched playbook objects
  const matchedIds = matches.map((m) => m.playbook_id)
  const { data: matchedPlaybooks } = await db
    .from('playbooks')
    .select('*')
    .in('id', matchedIds)

  if (!matchedPlaybooks) return []

  const playbookMap = new Map<string, Playbook>(
    matchedPlaybooks.map((pb: Playbook) => [pb.id, pb])
  )

  const result: PlaybookMatch[] = matches
    .filter((m) => playbookMap.has(m.playbook_id))
    .map((m) => ({
      playbook: playbookMap.get(m.playbook_id)!,
      match_score: m.match_score,
      match_reason: m.match_reason,
    }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3)

  // Update session_analysis with matched IDs
  await db
    .from('session_analysis')
    .update({ matched_playbook_ids: result.map((r) => r.playbook.id) })
    .eq('session_id', sessionAnalysis.session_id)

  // Log playbook_sessions + increment usage count
  for (const match of result) {
    await db
      .from('playbook_sessions')
      .upsert(
        {
          playbook_id: match.playbook.id,
          session_id: sessionAnalysis.session_id,
          match_score: match.match_score,
          match_reason: match.match_reason,
        },
        { onConflict: 'playbook_id,session_id' }
      )
  }

  return result
}
