import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Mode B: Whisper audio transcription (activated when OPENAI_API_KEY is set)
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Audio transcription requires OPENAI_API_KEY to be configured' },
      { status: 501 }
    )
  }

  const formData = await request.formData()
  const audio = formData.get('audio') as File | null
  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  const whisperForm = new FormData()
  whisperForm.append('file', audio, audio.name || 'recording.webm')
  whisperForm.append('model', 'whisper-1')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: whisperForm,
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Whisper API error: ${err}` }, { status: 500 })
  }

  const json = await res.json()
  return NextResponse.json({ data: { transcript: json.text } })
}
