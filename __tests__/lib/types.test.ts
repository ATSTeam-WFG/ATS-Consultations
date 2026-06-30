import { describe, it, expect } from 'vitest'
import { PROBLEM_TAGS } from '@/lib/types'

describe('PROBLEM_TAGS', () => {
  it('contains the expected number of tags', () => {
    expect(PROBLEM_TAGS).toHaveLength(20)
  })

  it('has no duplicate values', () => {
    const unique = new Set(PROBLEM_TAGS)
    expect(unique.size).toBe(PROBLEM_TAGS.length)
  })

  it('contains key domain-specific tags', () => {
    expect(PROBLEM_TAGS).toContain('order_entry')
    expect(PROBLEM_TAGS).toContain('wire_fraud_prevention')
    expect(PROBLEM_TAGS).toContain('ai_adoption')
    expect(PROBLEM_TAGS).toContain('compliance')
  })

  it('all tags are snake_case strings', () => {
    for (const tag of PROBLEM_TAGS) {
      expect(tag).toMatch(/^[a-z][a-z0-9_]*$/)
    }
  })
})
