'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CalendarDays, Calendar, MessageSquare, Settings } from 'lucide-react'

const TABS = [
  { href: '/dashboard',       label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents',          label: 'Agents',    icon: Users },
  { href: '/sessions',        label: 'Sessions',  icon: CalendarDays },
  { href: '/calendar',        label: 'Calendar',  icon: Calendar },
  { href: '/qa',              label: 'Ask',       icon: MessageSquare },
  { href: '/settings/intake', label: 'Settings',  icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-tab${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
