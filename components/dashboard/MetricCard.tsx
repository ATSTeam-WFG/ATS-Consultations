interface MetricCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: boolean
}

export function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--ats-surface)',
        border: accent ? '1px solid var(--ats-border)' : '1px solid var(--ats-border)',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderTop: accent ? '3px solid var(--ats-indigo)' : '1px solid var(--ats-border)',
      }}
    >
      <div className="section-label" style={{ marginBottom: '0.625rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: accent ? 'var(--ats-indigo)' : 'var(--ats-text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'var(--ats-text-3)', marginTop: '0.5rem' }}>{sub}</div>
      )}
    </div>
  )
}
