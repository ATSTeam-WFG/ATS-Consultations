'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { MetricCard } from './MetricCard'
import { TopProblemsChart } from './TopProblemsChart'
import { TrendAlerts } from './TrendAlerts'
import { TopPlaybooks } from './TopPlaybooks'
import type { Trend } from '@/lib/types'

interface DashboardInitialData {
  totalAgents: number
  totalSessions: number
  processedSessions: number
  pendingSessions: number
  topProblems: { tag: string; count: number }[]
  trends: Trend[]
  topPlaybooks: { id: string; title: string; usage_count: number }[]
}

export function DashboardStats({ initialData }: { initialData: DashboardInitialData }) {
  const [data, setData] = useState(initialData)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/dashboard')
    if (!res.ok) return
    const json = await res.json()
    if (!json.data) return
    const d = json.data
    setData({
      totalAgents: d.total_agents ?? 0,
      totalSessions: d.total_sessions ?? 0,
      processedSessions: d.processed_sessions ?? 0,
      pendingSessions: d.pending_sessions ?? 0,
      topProblems: d.top_problems ?? [],
      trends: d.active_trends ?? [],
      topPlaybooks: d.top_playbooks ?? [],
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const { totalAgents, totalSessions, processedSessions, pendingSessions, topProblems, trends, topPlaybooks } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="mob-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard label="Agents" value={totalAgents} />
        <MetricCard label="Sessions" value={totalSessions} />
        <MetricCard label="Processed" value={processedSessions} accent />
        <MetricCard label="Pending" value={pendingSessions} sub="awaiting analysis" />
      </div>

      <div className="mob-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <TopProblemsChart data={topProblems} />
        <TrendAlerts trends={trends} />
      </div>

      <div className="mob-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <TopPlaybooks playbooks={topPlaybooks} />
      </div>
    </div>
  )
}
