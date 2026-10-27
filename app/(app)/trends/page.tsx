'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Lightbulb,
  BarChart2, Users, AlertTriangle, Activity,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Sector,
} from 'recharts'
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

interface HeatmapCell {
  tier: string
  tag: string
  count: number
}

interface DirectionPoint {
  date: string
  rising: number
  stable: number
  falling: number
}

interface TrendsData {
  trends: Trend[]
  summary: TrendSummary | null
  categories: CategoryBreakdown[]
  top_agents: TopAgent[]
  severity_distribution: { low: number; medium: number; high: number; critical: number }
  heatmap_data: HeatmapCell[]
  direction_over_time: DirectionPoint[]
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
  critical: '#7f1d1d',
}

const TIER_ORDER = ['UNICORN', 'DIAMOND', 'GOLD', 'SILVER']
const TIER_COLORS: Record<string, string> = {
  UNICORN: '#7c3aed',
  DIAMOND: '#0ea5e9',
  GOLD: '#c4a574',
  SILVER: '#6b7280',
}

const WFG_CHART_COLORS = ['#6366f1', '#c4a574', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f766e']

function severityLabel(avg: number): string {
  if (avg >= 3.5) return 'critical'
  if (avg >= 2.5) return 'high'
  if (avg >= 1.5) return 'medium'
  return 'low'
}

type SortKey = 'session_count' | 'agent_count' | 'severity_avg' | 'trend_direction'

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData>({
    trends: [], summary: null, categories: [], top_agents: [],
    severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
    heatmap_data: [], direction_over_time: [],
  })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('trend_insights')
    return null
  })
  const [insightsUpdatedAt, setInsightsUpdatedAt] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('trend_insights_at')
    return null
  })
  const [sortKey, setSortKey] = useState<SortKey>('session_count')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [activeSlice, setActiveSlice] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((j) => setData(j.data ?? {
        trends: [], summary: null, categories: [], top_agents: [],
        severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
        heatmap_data: [], direction_over_time: [],
      }))
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
        const now = new Date().toISOString()
        setInsights(freshInsights)
        setInsightsUpdatedAt(now)
        localStorage.setItem('trend_insights', freshInsights)
        localStorage.setItem('trend_insights_at', now)
      }
      const res2 = await fetch('/api/trends')
      const j2 = await res2.json()
      setData(j2.data ?? data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trend detection failed')
    } finally {
      setRunning(false)
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const directionIcon = { rising: TrendingUp, falling: TrendingDown, stable: Minus }
  const directionColor = {
    rising: 'var(--ats-danger)',
    falling: 'var(--ats-success)',
    stable: 'var(--muted-foreground)',
  }

  const { trends, summary, categories, top_agents, severity_distribution, heatmap_data, direction_over_time } = data

  const lastRun = trends.length > 0
    ? trends.reduce((latest, t) => t.updated_at > latest ? t.updated_at : latest, trends[0].updated_at)
    : null

  // Top 8 tags for heatmap
  const tagFreq = new Map<string, number>()
  for (const cell of heatmap_data) tagFreq.set(cell.tag, (tagFreq.get(cell.tag) ?? 0) + cell.count)
  const top8Tags = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t)

  // Radar data
  const radarData = categories.map((cat) => ({
    subject: cat.name.length > 16 ? cat.name.slice(0, 14) + '…' : cat.name,
    sessions: cat.count,
    severity: Math.round(cat.avg_severity * 25),
  }))

  // Bar chart — direction per category
  const categoryBarData = categories.map((cat) => {
    const catTrends = trends.filter((t) => t.category === cat.name)
    return {
      name: cat.name.length > 14 ? cat.name.slice(0, 12) + '…' : cat.name,
      rising: catTrends.filter((t) => t.trend_direction === 'rising').length,
      stable: catTrends.filter((t) => t.trend_direction === 'stable').length,
      falling: catTrends.filter((t) => t.trend_direction === 'falling').length,
    }
  }).filter((d) => d.rising + d.stable + d.falling > 0)

  // Horizontal bar — top 15 tags by session_count
  const topTagsBar = [...trends]
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 15)
    .map((t) => ({
      name: t.tag.replace(/_/g, ' '),
      sessions: t.session_count,
      agents: t.agent_count,
      sev: severityLabel(t.severity_avg ?? 1),
      color: SEVERITY_COLORS[severityLabel(t.severity_avg ?? 1)],
    }))

  // Pie data
  const pieData = [
    { name: 'Low', value: severity_distribution.low, color: SEVERITY_COLORS.low },
    { name: 'Medium', value: severity_distribution.medium, color: SEVERITY_COLORS.medium },
    { name: 'High', value: severity_distribution.high, color: SEVERITY_COLORS.high },
    { name: 'Critical', value: severity_distribution.critical, color: SEVERITY_COLORS.critical },
  ].filter((d) => d.value > 0)

  // Filtered + sorted trends table
  const filteredTrends = trends
    .filter((t) => filterDirection === 'all' || t.trend_direction === filterDirection)
    .filter((t) => filterCategory === 'all' || t.category === filterCategory)
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? 0
      let bv: string | number = b[sortKey] ?? 0
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

  const allCategories = Array.from(new Set(trends.map((t) => t.category).filter(Boolean))) as string[]

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
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem', background: 'var(--ats-blue)', color: '#fff',
            border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem',
            fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.7 : 1,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Section A: Executive Summary */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <StatCard icon={<BarChart2 size={16} />} label="Total Patterns" value={summary.total_patterns} />
                <StatCard icon={<TrendingUp size={16} color="var(--ats-danger)" />} label="Rising" value={summary.rising} valueColor="var(--ats-danger)" />
                <StatCard icon={<TrendingDown size={16} color="var(--ats-success)" />} label="Falling" value={summary.falling} valueColor="var(--ats-success)" />
                <StatCard icon={<Users size={16} />} label="Agents Affected" value={summary.agents_analyzed} />
                <StatCard icon={<Activity size={16} />} label="Sessions Analyzed" value={summary.sessions_analyzed} />
                <StatCard icon={<AlertTriangle size={16} color="var(--color-gold)" />} label="Most Critical Area" value={summary.top_category} small />
              </div>
            )}

            {/* Section B: AI Insights */}
            <div className="ats-card" style={{ borderLeft: '3px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lightbulb size={16} color="var(--color-gold)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>AI Insights</span>
                </div>
                {insightsUpdatedAt && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Updated {new Date(insightsUpdatedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {insights ? (
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>{insights}</p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Run detection to generate fresh insights from Claude.
                </p>
              )}
            </div>

            {/* Sections C + F: Direction Bar + Severity Pie side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
              {/* Section C: Trend Direction Bar Chart */}
              {categoryBarData.length > 0 && (
                <div className="ats-card">
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Trend Direction by Category</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={categoryBarData} margin={{ top: 0, right: 8, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '0.8125rem', borderRadius: '0.375rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }} />
                      <Bar dataKey="rising" name="Rising" fill="#dc2626" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="stable" name="Stable" fill="#6b7280" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="falling" name="Falling" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Section F: Severity Pie */}
              {pieData.length > 0 && (
                <div className="ats-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Severity Distribution</h2>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          dataKey="value"
                          onMouseEnter={(_, index) => setActiveSlice(index)}
                          onMouseLeave={() => setActiveSlice(null)}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                              opacity={activeSlice === null || activeSlice === index ? 1 : 0.55}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: '0.8125rem', borderRadius: '0.375rem' }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '0.8rem' }}
                          formatter={(value) => value}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Section D: Problem Frequency Horizontal Bar */}
            {topTagsBar.length > 0 && (
              <div className="ats-card">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Top Problem Tags by Session Count</h2>
                <ResponsiveContainer width="100%" height={Math.max(300, topTagsBar.length * 28)}>
                  <BarChart data={topTagsBar} layout="vertical" margin={{ top: 0, right: 60, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip
                      contentStyle={{ fontSize: '0.8125rem', borderRadius: '0.375rem' }}
                      formatter={(value, name) => [value, name === 'sessions' ? 'Sessions' : 'Agents']}
                    />
                    <Bar dataKey="sessions" name="sessions" radius={[0, 4, 4, 0]}>
                      {topTagsBar.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                    <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>{sev}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section E: Category Radar */}
            {radarData.length >= 3 && (
              <div className="ats-card">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Category Impact Radar</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar name="Sessions" dataKey="sessions" stroke={WFG_CHART_COLORS[0]} fill={WFG_CHART_COLORS[0]} fillOpacity={0.25} />
                    <Radar name="Severity ×25" dataKey="severity" stroke={WFG_CHART_COLORS[1]} fill={WFG_CHART_COLORS[1]} fillOpacity={0.18} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Tooltip contentStyle={{ fontSize: '0.8125rem', borderRadius: '0.375rem' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Section G: Agent Tier Heatmap */}
            {top8Tags.length > 0 && (
              <div className="ats-card">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Agent Tier × Problem Heatmap</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>Tier</th>
                        {top8Tags.map((tag) => (
                          <th key={tag} style={{ padding: '0.5rem 0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                            {tag.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIER_ORDER.map((tier) => {
                        const maxForTier = Math.max(...top8Tags.map((tag) => {
                          const cell = heatmap_data.find((c) => c.tier === tier && c.tag === tag)
                          return cell?.count ?? 0
                        }))
                        return (
                          <tr key={tier}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: TIER_COLORS[tier], whiteSpace: 'nowrap' }}>
                              {tier}
                            </td>
                            {top8Tags.map((tag) => {
                              const cell = heatmap_data.find((c) => c.tier === tier && c.tag === tag)
                              const count = cell?.count ?? 0
                              const intensity = maxForTier > 0 ? count / maxForTier : 0
                              const bg = count === 0
                                ? 'var(--secondary)'
                                : `rgba(99, 102, 241, ${0.12 + intensity * 0.7})`
                              return (
                                <td
                                  key={tag}
                                  title={`${tier} × ${tag.replace(/_/g, ' ')}: ${count}`}
                                  style={{
                                    padding: '0.5rem',
                                    textAlign: 'center',
                                    background: bg,
                                    fontWeight: count > 0 ? 700 : 400,
                                    color: intensity > 0.55 ? '#fff' : 'var(--foreground)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.85rem',
                                    cursor: 'default',
                                  }}
                                >
                                  {count || '—'}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section H: Top Agents Table */}
            {top_agents.length > 0 && (
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Top Agents by Issue Count</h2>
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
                      {top_agents.map((agent, i) => {
                        const rowColor = i === 0 ? 'rgba(220,38,38,0.04)' : i === 1 ? 'rgba(217,119,6,0.04)' : 'transparent'
                        return (
                          <tr key={i} style={{ background: rowColor }}>
                            <td style={{ fontWeight: 600 }}>{agent.name}</td>
                            <td style={{ color: 'var(--muted-foreground)' }}>{agent.agency_name || '—'}</td>
                            <td>
                              <span style={{ fontWeight: 700, color: i < 2 ? 'var(--ats-danger)' : 'var(--ats-blue)' }}>
                                {agent.issue_count}
                              </span>
                            </td>
                            <td>
                              {agent.top_tag ? (
                                <span className="tag-pill">{agent.top_tag.replace(/_/g, ' ')}</span>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section I: All Patterns Table with sort + filter */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>All Patterns</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.8rem', background: 'var(--background)', cursor: 'pointer' }}
                  >
                    <option value="all">All directions</option>
                    <option value="rising">Rising</option>
                    <option value="stable">Stable</option>
                    <option value="falling">Falling</option>
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.8rem', background: 'var(--background)', cursor: 'pointer' }}
                  >
                    <option value="all">All categories</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ats-table">
                  <thead>
                    <tr>
                      <th>Problem Tag</th>
                      <th>Category</th>
                      <SortTh label="Direction" col="trend_direction" current={sortKey} asc={sortAsc} onSort={handleSort} />
                      <SortTh label="Sessions" col="session_count" current={sortKey} asc={sortAsc} onSort={handleSort} />
                      <SortTh label="Agents" col="agent_count" current={sortKey} asc={sortAsc} onSort={handleSort} />
                      <SortTh label="Avg Severity" col="severity_avg" current={sortKey} asc={sortAsc} onSort={handleSort} />
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrends.map((trend) => {
                      const Icon = directionIcon[trend.trend_direction ?? 'stable'] ?? Minus
                      const color = directionColor[trend.trend_direction ?? 'stable']
                      const sev = severityLabel(trend.severity_avg ?? 1)
                      return (
                        <tr key={trend.id}>
                          <td><span className="tag-pill">{trend.tag.replace(/_/g, ' ')}</span></td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{trend.category ?? '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color }}>
                              <Icon size={13} />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                {trend.trend_direction ?? 'stable'}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{trend.session_count}</td>
                          <td style={{ fontWeight: 600 }}>{trend.agent_count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div style={{ width: 36, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(100, ((trend.severity_avg ?? 0) / 4) * 100)}%`,
                                  height: '100%',
                                  background: SEVERITY_COLORS[sev],
                                  borderRadius: 3,
                                }} />
                              </div>
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 600,
                                color: SEVERITY_COLORS[sev], textTransform: 'capitalize',
                              }}>
                                {trend.severity_avg ? trend.severity_avg.toFixed(1) : '—'} {sev}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: '280px' }}>
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
  icon, label, value, valueColor, small,
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
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{ fontSize: small ? '0.9375rem' : '1.75rem', fontWeight: 700, margin: 0, color: valueColor ?? 'var(--foreground)', lineHeight: 1.2 }}>
        {value}
      </p>
    </div>
  )
}

function SortTh({
  label, col, current, asc, onSort,
}: {
  label: string
  col: SortKey
  current: SortKey
  asc: boolean
  onSort: (col: SortKey) => void
}) {
  const active = current === col
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label} {active ? (asc ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
    </th>
  )
}
