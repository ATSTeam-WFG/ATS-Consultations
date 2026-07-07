'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths, isBefore, isAfter,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { ScheduleModal } from './ScheduleModal'
import type { SessionStatus } from '@/lib/types'

interface CalendarSession {
  id: string
  session_date: string
  status: SessionStatus
  agent_id: string
  agents?: { name: string; agency_name?: string } | null
}

interface AgentOption {
  id: string
  name: string
  agency_name?: string | null
}

interface CalendarGridProps {
  sessions: CalendarSession[]
  agents: AgentOption[]
}

const STATUS_STYLE: Record<SessionStatus, { bg: string; border: string; dot: string; label: string }> = {
  scheduled: { bg: '#eef2ff', border: '#6366f1', dot: '#6366f1', label: '📅' },
  pending:   { bg: '#fffbeb', border: '#f59e0b', dot: '#f59e0b', label: '⏳' },
  processing:{ bg: '#eff6ff', border: '#3b82f6', dot: '#3b82f6', label: '🔄' },
  processed: { bg: '#f0fdf4', border: '#10b981', dot: '#10b981', label: '✅' },
  failed:    { bg: '#fef2f2', border: '#ef4444', dot: '#ef4444', label: '⚠' },
}

interface RescheduleTarget {
  id: string
  session_date: string
  agent_id: string
  agent_name: string
}

export function CalendarGrid({ sessions: initialSessions, agents }: CalendarGridProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sessions, setSessions] = useState(initialSessions)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<RescheduleTarget | null>(null)

  const today = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const sessionsByDate: Record<string, CalendarSession[]> = {}
  for (const s of sessions) {
    const key = s.session_date
    if (!sessionsByDate[key]) sessionsByDate[key] = []
    sessionsByDate[key].push(s)
  }

  function handleDayClick(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const isToday_ = isToday(day)
    const isFuture = isAfter(day, today) && !isToday_

    if (isFuture || isToday_) {
      setScheduleDate(dateStr)
    }
  }

  function handleEventClick(e: React.MouseEvent, session: CalendarSession) {
    e.stopPropagation()
    if (session.status === 'scheduled') {
      setRescheduleTarget({
        id: session.id,
        session_date: session.session_date,
        agent_id: session.agent_id,
        agent_name: session.agents?.name ?? 'Unknown',
      })
    } else {
      router.push(`/sessions/${session.id}`)
    }
  }

  function handleScheduled(newSession: { id: string; agent_id: string; session_date: string; status: string; agents?: { name: string } }) {
    setSessions((prev) => [...prev, newSession as CalendarSession])
    setScheduleDate(null)
  }

  function handleRescheduled(updated: { id: string; agent_id: string; session_date: string; status: string; agents?: { name: string } }) {
    setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, session_date: updated.session_date } : s))
    setRescheduleTarget(null)
  }

  // Sidebar data
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekEnd = format(addMonths(today, 0), 'yyyy-MM-dd')
  const nextWeekEnd = new Date(today)
  nextWeekEnd.setDate(today.getDate() + 7)
  const nextWeekEndStr = format(nextWeekEnd, 'yyyy-MM-dd')

  const upcomingThisWeek = sessions.filter(
    (s) => s.status === 'scheduled' && s.session_date >= todayStr && s.session_date <= nextWeekEndStr
  ).sort((a, b) => a.session_date.localeCompare(b.session_date))

  const needsAttention = sessions.filter(
    (s) => s.status === 'pending' || s.status === 'failed'
  ).sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Main calendar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ padding: '0.375rem 0.5rem', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer' }}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              style={{ padding: '0.375rem 0.75rem', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ padding: '0.375rem 0.5rem', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer' }}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.25rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', padding: '0.25rem 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)
            const isFuture = isAfter(day, today)
            const daySessions = sessionsByDate[dateStr] ?? []
            const isClickable = (isFuture || isCurrentDay) && agents.length > 0

            return (
              <div
                key={dateStr}
                onClick={() => isClickable && handleDayClick(day)}
                style={{
                  minHeight: '80px',
                  padding: '0.375rem',
                  background: isCurrentDay ? '#eef2ff' : 'var(--card)',
                  border: isCurrentDay ? '1px solid var(--ats-indigo)' : '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  opacity: inMonth ? 1 : 0.4,
                  cursor: isClickable ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrentDay ? 700 : 500,
                  color: isCurrentDay ? 'var(--ats-indigo)' : 'var(--foreground)',
                  marginBottom: '0.25rem',
                }}>
                  {format(day, 'd')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {daySessions.slice(0, 3).map((session) => {
                    const style = STATUS_STYLE[session.status] ?? STATUS_STYLE.pending
                    const agentName = session.agents?.name ?? 'Unknown'
                    return (
                      <button
                        key={session.id}
                        onClick={(e) => handleEventClick(e, session)}
                        title={session.status === 'scheduled' ? `Reschedule: ${agentName}` : `${style.label} ${agentName}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 4px',
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          borderRadius: '3px',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          color: 'var(--foreground)',
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{style.label}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{agentName}</span>
                        {session.status === 'scheduled' && (
                          <Pencil size={9} style={{ flexShrink: 0, opacity: 0.6 }} />
                        )}
                      </button>
                    )
                  })}
                  {daySessions.length > 3 && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', paddingLeft: '2px' }}>
                      +{daySessions.length - 3} more
                    </div>
                  )}
                </div>
                {isClickable && daySessions.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    fontSize: '1.25rem',
                    color: 'var(--muted-foreground)',
                    transition: 'opacity 0.15s',
                  }}
                  className="cal-day-add-hint"
                  >
                    +
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {(Object.entries(STATUS_STYLE) as [SessionStatus, typeof STATUS_STYLE[SessionStatus]][]).map(([status, s]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          ))}
          {agents.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
              Click a future date to schedule
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {upcomingThisWeek.length > 0 && (
          <div className="ats-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
              Upcoming this week
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingThisWeek.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/sessions/${s.id}`)}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.375rem 0.5rem', borderRadius: '0.375rem' }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.agents?.name ?? 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {new Date(s.session_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {needsAttention.length > 0 && (
          <div className="ats-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ats-warning)', marginBottom: '0.75rem' }}>
              Needs attention
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {needsAttention.map((s) => {
                const style = STATUS_STYLE[s.status]
                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/sessions/${s.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.375rem 0.5rem', borderRadius: '0.375rem' }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.agents?.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {new Date(s.session_date + 'T12:00:00').toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {scheduleDate && (
        <ScheduleModal
          date={scheduleDate}
          agents={agents}
          onClose={() => setScheduleDate(null)}
          onScheduled={handleScheduled}
        />
      )}

      {rescheduleTarget && (
        <ScheduleModal
          date={rescheduleTarget.session_date}
          agents={agents}
          onClose={() => setRescheduleTarget(null)}
          onScheduled={handleRescheduled}
          existingSession={rescheduleTarget}
        />
      )}
    </div>
  )
}
