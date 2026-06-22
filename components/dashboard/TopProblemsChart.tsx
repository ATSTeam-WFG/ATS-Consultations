interface TopProblemsChartProps {
  data: { tag: string; count: number }[]
}

export function TopProblemsChart({ data }: TopProblemsChartProps) {
  if (data.length === 0) {
    return (
      <div className="ats-card">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Top Problems</div>
        <div className="empty-state" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem' }}>No data yet. Process sessions to see trends.</p>
        </div>
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count))

  return (
    <div className="ats-card">
      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Top Problems</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {data.map(({ tag, count }) => (
          <div key={tag}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--foreground)' }}>{tag.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>{count}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(count / max) * 100}%`,
                  background: 'var(--ats-blue)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
