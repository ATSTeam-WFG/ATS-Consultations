import { notFound } from 'next/navigation'
import { IntakeForm } from '@/components/intake/IntakeForm'
import type { Contact } from '@/lib/types'

interface IntakeData {
  agentName: string
  agencyName: string
  wfgRep: string | null
  contacts: Contact[]
  alreadySubmitted: boolean
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/intake/${token}`, { cache: 'no-store' })

  if (!res.ok) notFound()

  const data: IntakeData = await res.json()

  if (data.alreadySubmitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        color: '#f1f5f9',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', marginBottom: '1.5rem',
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Already submitted
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', maxWidth: '360px' }}>
          We already have your discovery responses on file. Your WFG rep will be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <IntakeForm
      token={token}
      agentName={data.agentName}
      agencyName={data.agencyName}
      wfgRep={data.wfgRep}
      contacts={data.contacts}
    />
  )
}
