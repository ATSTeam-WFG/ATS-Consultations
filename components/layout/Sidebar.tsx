'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar,
  BookOpen,
  TrendingUp,
  Wrench,
  MessageSquare,
  LogOut,
  Settings,
  Inbox,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

const USER_NAMES: Record<string, string> = {
  'vupganlawar@wfgtitle.com': 'Vedant Upganlawar',
  'atatke@wfgtitle.com': 'Anish Tatke',
  'pkatudia@wfgtitle.com': 'Priyal Katudia',
  'acaruthers@wfgtitle.com': 'Alex Caruthers',
  'rozonian@wfgtitle.com': 'Ryan Ozonian',
}

const NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Core',
    items: [
      { href: '/requests', label: 'New Requests', icon: Inbox, badge: true },
      { href: '/agents', label: 'Agents', icon: Users },
      { href: '/sessions', label: 'Sessions', icon: CalendarDays },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
      { href: '/trends', label: 'Trends', icon: TrendingUp },
      { href: '/tools', label: 'Tools', icon: Wrench },
    ],
  },
  {
    section: 'Q&A',
    items: [
      { href: '/qa', label: 'Ask', icon: MessageSquare },
    ],
  },
  {
    section: 'Settings',
    items: [
      { href: '/settings/intake', label: 'Intake Questions', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('')
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const email = data.user?.email?.toLowerCase() ?? ''
      setName(USER_NAMES[email] ?? email.split('@')[0])
    })
  }, [])

  useEffect(() => {
    fetch('/api/requests')
      .then((r) => r.json())
      .then((j) => setPendingRequests((j.data ?? []).length))
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg className="sidebar-logo-seal" width="17" height="17" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <polygon points="6,1.5 9.9,3.75 9.9,8.25 6,10.5 2.1,8.25 2.1,3.75" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round" opacity="0.9" />
          <circle cx="6" cy="6" r="1.6" fill="#6366f1" />
        </svg>
        <div>
          <div className="sidebar-logo-name">ATS <span>Consultations</span></div>
          <div className="sidebar-logo-tagline">White Glove Intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="sidebar-nav-section">{group.section}</div>
            {group.items.map(({ href, label, icon: Icon, badge }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              const badgeCount = badge ? pendingRequests : 0
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={16} />
                    {label}
                  </span>
                  {badgeCount > 0 && (
                    <span style={{
                      padding: '0.0625rem 0.4375rem',
                      background: 'var(--color-gold)',
                      color: '#fff',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {name && (
          <div style={{
            padding: '0.75rem 0.75rem 0.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#6366f1',
            borderTop: '1px solid var(--border)',
            marginBottom: '0.25rem',
          }}>
            {name}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.45, fontSize: '0.75rem' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
