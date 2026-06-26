'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { ReportBuilder } from './ReportBuilder'
import type { SessionAnalysis } from '@/lib/types'

interface ReportBuilderButtonProps {
  sessionId: string
  analysis: SessionAnalysis
  agentName: string
}

export function ReportBuilderButton({ sessionId, analysis, agentName }: ReportBuilderButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.875rem',
          background: 'var(--ats-indigo)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <FileText size={14} />
        Generate Report
      </button>

      {open && (
        <ReportBuilder
          sessionId={sessionId}
          analysis={analysis}
          agentName={agentName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
