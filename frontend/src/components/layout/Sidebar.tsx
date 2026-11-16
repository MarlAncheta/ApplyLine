import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Columns3,
  FileText,
  History,
  LayoutDashboard,
  BellRing,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/logo'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/applications', label: 'Applications', icon: BriefcaseBusiness },
  { to: '/app/board', label: 'Kanban Board', icon: Columns3 },
  { to: '/app/companies', label: 'Companies', icon: Building2 },
  { to: '/app/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/reminders', label: 'Reminders', icon: BellRing },
  { to: '/app/documents', label: 'Documents', icon: FileText },
  { to: '/app/activity', label: 'Activity', icon: History },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const user = useAuthStore((s) => s.user)

  return (
    <>
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <NavLink to="/app" onClick={() => setSidebarOpen(false)}>
            <Logo size={32} />
          </NavLink>
          <button
            className="rounded p-1 text-muted hover:text-text lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-text',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <NavLink
            to="/app/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-2"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{user?.full_name ?? 'My account'}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  )
}
