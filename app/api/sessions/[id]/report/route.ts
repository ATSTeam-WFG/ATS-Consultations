import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReportDocument } from '@/components/report/ReportDocument'
import type { SessionAnalysis } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { pain_point_indices = [], sections = {} } = body

  const db = createServiceRoleClient()
  const { data: session, error } = await db
    .from('sessions')
    .select('*, agents(name, agency_name), session_analysis(*)')
    .eq('id', id)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const analysis = session.session_analysis as SessionAnalysis | null
  if (!analysis) {
    return NextResponse.json({ error: 'No analysis found for this session' }, { status: 400 })
  }

  const agent = session.agents as { name: string; agency_name?: string } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    // @ts-expect-error — react-pdf uses its own JSX types separate from React DOM
    createElement(ReportDocument, {
      agentName: agent?.name ?? 'Unknown Agent',
      agencyName: agent?.agency_name ?? '',
      sessionDate: session.session_date as string,
      sessionType: session.session_type as string,
      repName: session.rep_name as string | null,
      analysis,
      selectedPainPointIndices: pain_point_indices,
      sections: {
        summary: sections.summary ?? true,
        tools: sections.tools ?? true,
        roadmap: sections.roadmap ?? true,
        roi: sections.roi ?? true,
      },
    })
  )

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ATS-Report-${(agent?.name ?? 'Session').replace(/\s+/g, '-')}-${session.session_date}.pdf"`,
    },
  })
}
