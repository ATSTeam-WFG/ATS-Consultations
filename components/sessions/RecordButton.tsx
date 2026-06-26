'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Check, Loader2 } from 'lucide-react'

type RecordState = 'idle' | 'recording' | 'processing' | 'done'

interface RecordButtonProps {
  onTranscript: (text: string) => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export function RecordButton({ onTranscript }: RecordButtonProps) {
  const [state, setState] = useState<RecordState>('idle')
  const [wordCount, setWordCount] = useState(0)
  const [supported, setSupported] = useState<boolean | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const accumulatedRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SpeechRecognitionCtor)
  }, [])

  function startRecording() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    accumulatedRef.current = ''
    setWordCount(0)
    setState('recording')

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        accumulatedRef.current += finalText
      }

      const words = (accumulatedRef.current + interimText).trim().split(/\s+/).filter(Boolean)
      setWordCount(words.length)
    }

    recognition.onerror = () => {
      setState('idle')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      if (recognitionRef.current) {
        setState('processing')
        const transcript = accumulatedRef.current.trim()
        if (transcript) {
          onTranscript(transcript)
          setState('done')
          setTimeout(() => setState('idle'), 3000)
        } else {
          setState('idle')
        }
        recognitionRef.current = null
      }
    }

    recognition.start()
  }

  function stopRecording() {
    if (recognitionRef.current) {
      const r = recognitionRef.current
      recognitionRef.current = r // keep ref so onend knows we stopped intentionally
      r.stop()
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) {
        onTranscript(text)
        setState('done')
        setTimeout(() => setState('idle'), 3000)
      }
    }
    reader.readAsText(file)
  }

  if (supported === false) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.4rem 0.875rem',
          border: '1px solid var(--border)',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          background: 'var(--secondary)',
          color: 'var(--foreground)',
        }}>
          <Mic size={14} />
          Upload audio transcript
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          Voice recording not supported in this browser
        </span>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.875rem',
          border: '1px solid var(--border)',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          background: 'var(--secondary)',
          color: 'var(--foreground)',
        }}
      >
        <Mic size={14} />
        Record session
      </button>
    )
  }

  if (state === 'recording') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={stopRecording}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.875rem',
            border: '1px solid #ef4444',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            background: '#fef2f2',
            color: '#dc2626',
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'pulse 1s infinite',
            flexShrink: 0,
          }} />
          <Square size={12} fill="#dc2626" />
          Stop recording
        </button>
        {wordCount > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {wordCount} words
          </span>
        )}
      </div>
    )
  }

  if (state === 'processing') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Processing transcript...
      </div>
    )
  }

  // done
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--ats-success)' }}>
      <Check size={14} />
      Transcript ready
    </div>
  )
}
