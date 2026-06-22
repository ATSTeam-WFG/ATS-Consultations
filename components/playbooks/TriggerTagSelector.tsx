'use client'

import { PROBLEM_TAGS, type ProblemTag } from '@/lib/types'

interface TriggerTagSelectorProps {
  selected: ProblemTag[]
  onChange: (tags: ProblemTag[]) => void
}

export function TriggerTagSelector({ selected, onChange }: TriggerTagSelectorProps) {
  function toggle(tag: ProblemTag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {PROBLEM_TAGS.map((tag) => {
        const isSelected = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: `1px solid ${isSelected ? 'var(--ats-blue)' : 'var(--border)'}`,
              background: isSelected ? 'var(--ats-blue-light)' : 'transparent',
              color: isSelected ? 'var(--ats-blue-dark)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tag.replace(/_/g, ' ')}
          </button>
        )
      })}
    </div>
  )
}
