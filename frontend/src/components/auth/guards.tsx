import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingBlock } from '@/components/ui/feedback'
import { useAuthStore } from '@/stores/auth.store'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <LoadingBlock label="Preparing your workspace…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <LoadingBlock label="Just a moment…" />
  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}
