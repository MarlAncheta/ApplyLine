import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, Settings, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useToast } from '@/hooks/use-toast'
import { extractErrorMessage } from '@/services/api'

export function Topbar() {
  const { toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
      toast('Logged out. Your search will be here when you return.', 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="hidden text-sm text-muted sm:block">
          Keep the momentum going. You've got this.
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account menu">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-text">{user?.full_name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/app/profile')}>
            <UserRound className="h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/app/settings')}>
            <Settings className="h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={handleLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
