import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('transcript') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Read as text if small enough
  const text = await file.text()
  const db = createServiceRoleClient()

  // Upload to storage
  const storagePath = `transcripts/${user.id}/${id}/${file.name}`
  const storageClient = createServiceRoleClient()
  const { error: uploadError } = await storageClient.storage
    .from('transcripts')
    .upload(storagePath, file, { upsert: true })

  let transcriptUrl: string | null = null
  if (!uploadError) {
    const { data: { publicUrl } } = storageClient.storage
      .from('transcripts')
      .getPublicUrl(storagePath)
    transcriptUrl = publicUrl
  }

  // Save transcript text + URL on session
  const { data, error } = await db
    .from('sessions')
    .update({
      transcript_text: text.slice(0, 50000), // cap at 50k chars
      transcript_url: transcriptUrl,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
