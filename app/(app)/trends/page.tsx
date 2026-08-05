'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Lightbulb, BarChart2, Users, AlertTriangle } from 'lucide-react'
import type { Trend } from '@/lib/types'

interface TrendSummary {
  total_patterns: number
  rising: number
  stable: number
  falling: number
  sessions_analyzed: number
  agents_analyzed: number
  top_category: string
}

interface CategoryBreakdown {
  name: string
  count: number
  avg_severity: number
}

interface TopAgent {
  name: string
  agency_name: string
  issue_count: number
  top_tag: string
}

interface TrendsData {
  trends: Trend[]
  summary: TrendSummary | null
  categories: CategoryBreakdown[]
  top_agents: TopAgent[]
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
  critical: '#7f1d1d',
}

function severityLabel(avg: number): string {
  if (avg >= 3.5) return 'critical'
  if (avg >= 2.5) return 'high'
  if (avg >= 1.5) return 'medium'
  return 'low'
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData>({ trends: [], summary: null, categories: [], top_agents: [] })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('trend_insights')
    return null
  })

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((j) => setData(j.data ?? { trends: [], summary: null, categories: [], top_agents: [] }))
      .finally(() => setLoading(false))
  }, [])

  async function runDetection() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/trends', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Trend detection failed')
      }
      const postJson = await res.json()
      const freshInsights: string = postJson.data?.insights ?? ''
      if (freshInsights) {
        setInsights(freshInsights)
        localStorage.setItem('trend_insights', freshInsights)
      }
      const res2 = await fetch('/api/trends')
      const j2 = await res2.json()
      setData(j2.data ?? { trends: [], summary: null, categories: [], top_agents: [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trend detection failed')
    } finally {
      setRunning(false)
    }
  }

  const directionIcon = { rising: TrendingUp, falling: TrendingDown, stable: Minus }
  const directionColor = {
    rising: 'var(--ats-danger)',
    falling: 'var(--ats-success)',
    stable: 'var(--muted-foreground)',
  }

  const { trends, summary, categories, top_agents } = data

  const lastRun = trends.length > 0
    ? trends.reduce((latest, t) => t.updated_at > latest ? t.updated_at : latest, trends[0].updated_at)
    : null

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trends</h1>
          {lastRun && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
              Last run: {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
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
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Section 1: Stats Cards */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <StatCard icon={<BarChart2 size={18} />} label="Total Patterns" value={summary.total_patterns} />
                <StatCard
                  icon={<TrendingUp size={18} color="var(--ats-danger)" />}
                  label="Rising Issues"
                  value={summary.rising}
                  valueColor="var(--ats-danger)"
                />
                <StatCard icon={<Users size={18} />} label="Agents Affected" value={summary.agents_analyzed} />
                <StatCard
                  icon={<AlertTriangle size={18} color="var(--color-gold)" />}
                  label="Most Critical Area"
                  value={summary.top_category}
                  small
                />
              </div>
            )}

            {/* Section 2: Insights */}
            <div className="ats-card" style={{ borderLeft: '3px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Lightbulb size={16} color="var(--color-gold)" />
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>AI Insights</span>
              </div>
              {insights ? (
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>{insights}</p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Run detection to generate fresh insights from Claude.
                </p>
              )}
            </div>

            {/* Section 3: Category Breakdown */}
            {categories.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Category Breakdown</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {categories.map((cat) => {
                    const sev = severityLabel(cat.avg_severity)
                    return (
                      <div key={cat.name} className="ats-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '999px',
                            background: SEVERITY_COLORS[sev] + '22',
                            color: SEVERITY_COLORS[sev],
                            textTransform: 'capitalize',
                          }}>{sev}</span>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--ats-blue)' }}>{cat.count}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.125rem 0 0' }}>
                          sessions · avg severity {cat.avg_severity.toFixed(1)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section 4: Top Agents by Issue Count */}
            {top_agents.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Top Agents by Issue Count</h2>
                <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="ats-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Agency</th>
                        <th>Issue Count</th>
                        <th>Top Tag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top_agents.map((agent, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{agent.name}</td>
                          <td style={{ color: 'var(--muted-foreground)' }}>{agent.agency_name || '—'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--ats-blue)' }}>{agent.issue_count}</td>
                          <td>
                            {agent.top_tag ? (
                              <span className="tag-pill">{agent.top_tag.replace(/_/g, ' ')}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 5: Full Trends Table */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>All Patterns</h2>
              <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ats-table">
                  <thead>
                    <tr>
                      <th>Problem Tag</th>
                      <th>Category</th>
                      <th>Direction</th>
                      <th>Sessions</th>
                      <th>Agents</th>
                      <th>Avg Severity</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((trend) => {
                      const Icon = directionIcon[trend.trend_direction ?? 'stable'] ?? Minus
                      const color = directionColor[trend.trend_direction ?? 'stable']
                      const sev = severityLabel(trend.severity_avg ?? 1)
                      return (
                        <tr key={trend.id}>
                          <td>
                            <span className="tag-pill">{trend.tag.replace(/_/g, ' ')}</span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            {trend.category ?? '—'}
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
                          <td style={{ fontWeight: 600 }}>{trend.agent_count}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '999px',
                              background: SEVERITY_COLORS[sev] + '22',
                              color: SEVERITY_COLORS[sev],
                              textTransform: 'capitalize',
                            }}>
                              {trend.severity_avg ? trend.severity_avg.toFixed(1) : '—'} {sev}
                            </span>
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
            </div>

          </div>
        )}
      </div>
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueColor,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  valueColor?: string
  small?: boolean
}) {
  return (
    <div className="ats-card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>
        {icon}
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{
        fontSize: small ? '1rem' : '1.75rem',
        fontWeight: 700,
        margin: 0,
        color: valueColor ?? 'var(--foreground)',
        lineHeight: 1.2,
      }}>{value}</p>
    </div>
  )
}
