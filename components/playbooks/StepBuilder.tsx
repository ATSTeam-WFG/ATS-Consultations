'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import type { PlaybookStep } from '@/lib/types'

interface StepBuilderProps {
  steps: PlaybookStep[]
  onChange: (steps: PlaybookStep[]) => void
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

function SortableStep({
  step,
  onUpdate,
  onDelete,
}: {
  step: PlaybookStep
  onUpdate: (updated: PlaybookStep) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '0.875rem',
        background: 'var(--card)',
        display: 'flex',
        gap: '0.75rem',
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'grab',
          color: 'var(--muted-foreground)',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          marginTop: '0.25rem',
        }}
      >
        <GripVertical size={16} />
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span
            style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              background: 'var(--ats-blue)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {step.order}
          </span>
          <input
            className="form-input"
            value={step.title}
            onChange={(e) => onUpdate({ ...step, title: e.target.value })}
            placeholder="Step title"
            style={{ flex: 1 }}
          />
        </div>

        <textarea
          className="form-input"
          value={step.description}
          onChange={(e) => onUpdate({ ...step, description: e.target.value })}
          placeholder="Step description..."
          style={{ resize: 'vertical', minHeight: '60px' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration (days)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={step.duration_days}
              onChange={(e) => onUpdate({ ...step, duration_days: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted-foreground)',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          marginTop: '0.25rem',
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export function StepBuilder({ steps, onChange }: StepBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)
    const reordered = [...steps]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onChange(reordered.map((s, i) => ({ ...s, order: i + 1 })))
  }

  function addStep() {
    const newStep: PlaybookStep = {
      id: generateId(),
      order: steps.length + 1,
      title: '',
      description: '',
      duration_days: 7,
      tools: [],
      deliverables: [],
    }
    onChange([...steps, newStep])
  }

  function updateStep(id: string, updated: PlaybookStep) {
    onChange(steps.map((s) => (s.id === id ? updated : s)))
  }

  function deleteStep(id: string) {
    const filtered = steps.filter((s) => s.id !== id)
    onChange(filtered.map((s, i) => ({ ...s, order: i + 1 })))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {steps.map((step) => (
            <SortableStep
              key={step.id}
              step={step}
              onUpdate={(updated) => updateStep(step.id, updated)}
              onDelete={() => deleteStep(step.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addStep}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '1px dashed var(--border)',
          borderRadius: '0.5rem',
          background: 'transparent',
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          justifyContent: 'center',
        }}
      >
        <Plus size={16} />
        Add step
      </button>
    </div>
  )
}
