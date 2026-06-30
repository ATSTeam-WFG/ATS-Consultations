import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/dashboard/MetricCard'

describe('MetricCard', () => {
  it('renders the label and value', () => {
    render(<MetricCard label="Agents" value={4} />)
    expect(screen.getByText('Agents')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<MetricCard label="Status" value="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders sub-label when provided', () => {
    render(<MetricCard label="Pending" value={3} sub="awaiting analysis" />)
    expect(screen.getByText('awaiting analysis')).toBeInTheDocument()
  })

  it('does not render sub-label when omitted', () => {
    render(<MetricCard label="Agents" value={4} />)
    expect(screen.queryByText('awaiting analysis')).not.toBeInTheDocument()
  })

  it('applies accent border when accent=true', () => {
    const { container } = render(<MetricCard label="Processed" value={10} accent />)
    const card = container.querySelector('.metric-card') as HTMLElement
    expect(card.style.borderTop).toContain('var(--ats-indigo)')
  })

  it('applies standard border when accent is omitted', () => {
    const { container } = render(<MetricCard label="Agents" value={4} />)
    const card = container.querySelector('.metric-card') as HTMLElement
    expect(card.style.borderTop).toContain('var(--ats-border)')
  })
})
