'use client'

import { useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SessionAnalysis, PainPoint } from '@/lib/types'

interface ReportBuilderProps {
  sessionId: string
  analysis: SessionAnalysis
  agentName: string
  onClose: () => void
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#d97706',
  medium: '#f59e0b',
  low: '#10b981',
}

function SortablePainPoint({
  pp,
  index,
  selected,
  onToggle,
}: {
  pp: PainPoint
  index: number
  selected: boolean
  onToggle: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(index) })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.625rem 0.75rem',
        background: selected ? 'var(--ats-indigo-light)' : 'var(--card)',
        border: selected ? '1px solid var(--ats-indigo)' : '1px solid var(--border)',
        borderRadius: '0.375rem',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--muted-foreground)', marginTop: '2px', flexShrink: 0 }}
        title="Drag to reorder"
      >
        ⠿
      </div>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(index)}
        style={{ marginTop: '2px', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: SEVERITY_COLOR[pp.severity] ?? '#9ca3af',
          }}>
            {pp.severity}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{pp.category}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>{pp.description}</div>
      </div>
    </div>
  )
}

export function ReportBuilder({ sessionId, analysis, agentName, onClose }: ReportBuilderProps) {
  const [order, setOrder] = useState<number[]>(analysis.pain_points.map((_, i) => i))
  const [selected, setSelected] = useState<Set<number>>(new Set(analysis.pain_points.map((_, i) => i)))
  const [sections, setSections] = useState({
    summary: true,
    tools: true,
    roadmap: true,
    roi: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = order.indexOf(Number(active.id))
      const newIdx = order.indexOf(Number(over.id))
      setOrder(arrayMove(order, oldIdx, newIdx))
    }
  }

  function togglePainPoint(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleSection(key: keyof typeof sections) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleDownload() {
    setLoading(true)
    setError(null)

    const selectedInOrder = order.filter((i) => selected.has(i))

    try {
      const res = await fetch(`/api/sessions/${sessionId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pain_point_indices: selectedInOrder,
          sections,
        }),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Failed to generate report')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `ATS-Report-${agentName.replace(/\s+/g, '-')}-${dateStr}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Generate Report</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
              Customize what to include — drag pain points to reorder
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section toggles */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
              Sections to include
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {([
                ['summary', 'Summary + Pain Points'],
                ['tools', 'Tool Recommendations'],
                ['roadmap', '90-Day Roadmap'],
                ['roi', 'ROI Estimate'],
              ] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={sections[key]} onChange={() => toggleSection(key)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Pain points */}
          {analysis.pain_points.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                  Pain points ({selected.size}/{analysis.pain_points.length} selected)
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setSelected(new Set(order))} style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ats-indigo)' }}>All</button>
                  <button type="button" onClick={() => setSelected(new Set())} style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>None</button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={order.map(String)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {order.map((idx) => (
                      <SortablePainPoint
                        key={idx}
                        pp={analysis.pain_points[idx]}
                        index={idx}
                        selected={selected.has(idx)}
                        onToggle={togglePainPoint}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          {error && <p style={{ fontSize: '0.8125rem', color: 'var(--ats-danger)', margin: 0 }}>{error}</p>}
          {!error && <div />}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || selected.size === 0 && !Object.values(sections).some(Boolean)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                background: 'var(--ats-indigo)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
              {loading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
