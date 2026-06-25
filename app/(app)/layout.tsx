import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrapper">
        <main className="main-content">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
