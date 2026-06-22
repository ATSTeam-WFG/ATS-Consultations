import type { Trend } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendAlertsProps {
  trends: Trend[]
}

const directionIcon = {
  rising: TrendingUp,
  falling: TrendingDown,
  stable: Minus,
}

const directionColor = {
  rising: 'var(--ats-danger)',
  falling: 'var(--ats-success)',
  stable: 'var(--muted-foreground)',
}

export function TrendAlerts({ trends }: TrendAlertsProps) {
  if (trends.length === 0) {
    return (
      <div className="ats-card">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Trend Alerts</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No trend data yet.</p>
      </div>
    )
  }

  return (
    <div className="ats-card">
      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.875rem' }}>Trend Alerts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {trends.map((trend) => {
          const Icon = directionIcon[trend.trend_direction ?? 'stable'] ?? Minus
          const color = directionColor[trend.trend_direction ?? 'stable']
          return (
            <div key={trend.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Icon size={16} style={{ color, flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                  {trend.tag.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {trend.session_count} sessions · {trend.description?.slice(0, 80) ?? ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
