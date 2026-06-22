'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Wrench,
  MessageSquare,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

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
      { href: '/agents', label: 'Agents', icon: Users },
      { href: '/sessions', label: 'Sessions', icon: CalendarDays },
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
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg className="sidebar-logo-seal" width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <polygon points="6,1.5 9.9,3.75 9.9,8.25 6,10.5 2.1,8.25 2.1,3.75" stroke="#818cf8" strokeWidth="1.2" strokeLinejoin="round" opacity="0.9" />
          <circle cx="6" cy="6" r="1.6" fill="#818cf8" />
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
            {group.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleSignOut}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
