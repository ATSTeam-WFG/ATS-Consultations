'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import type { Trend } from '@/lib/types'

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((j) => setTrends(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function runDetection() {
    setRunning(true)
    await fetch('/api/trends', { method: 'POST' })
    const res = await fetch('/api/trends')
    const j = await res.json()
    setTrends(j.data ?? [])
    setRunning(false)
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Trends</h1>
        <button
          onClick={runDetection}
          disabled={running}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.7 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: running ? 'spin 1s linear infinite' : 'none' }} />
          {running ? 'Running...' : 'Run detection'}
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : trends.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No trends detected</p>
              <p style={{ fontSize: '0.875rem' }}>Process sessions first, then run trend detection to identify patterns.</p>
            </div>
          </div>
        ) : (
          <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ats-table">
              <thead>
                <tr>
                  <th>Problem Tag</th>
                  <th>Direction</th>
                  <th>Sessions</th>
                  <th>Avg Severity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((trend) => {
                  const Icon = directionIcon[trend.trend_direction ?? 'stable'] ?? Minus
                  const color = directionColor[trend.trend_direction ?? 'stable']
                  return (
                    <tr key={trend.id}>
                      <td>
                        <span className="tag-pill">{trend.tag.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color }}>
                          <Icon size={14} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>
                            {trend.trend_direction ?? 'stable'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{trend.session_count}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>
                        {trend.severity_avg ? trend.severity_avg.toFixed(1) : '—'}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: '360px' }}>
                        {trend.description ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
