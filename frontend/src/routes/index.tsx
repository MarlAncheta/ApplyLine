import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/guards'
import { LoadingBlock } from '@/components/ui/feedback'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import NotFoundPage from '@/pages/NotFoundPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'))
const BoardPage = lazy(() => import('@/pages/BoardPage'))
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage'))
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const RemindersPage = lazy(() => import('@/pages/RemindersPage'))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'))
const ActivityPage = lazy(() => import('@/pages/ActivityPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function Loadable({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingBlock label="Loading…" />}>{children}</Suspense>
}

function protectedElement(node: ReactNode) {
  return <Loadable><ProtectedRoute>{node}</ProtectedRoute></Loadable>
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
  { path: '/register', element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: protectedElement(<DashboardPage />) },
      { path: 'applications', element: protectedElement(<ApplicationsPage />) },
      { path: 'board', element: protectedElement(<BoardPage />) },
      { path: 'companies', element: protectedElement(<CompaniesPage />) },
      { path: 'interviews', element: protectedElement(<InterviewsPage />) },
      { path: 'calendar', element: protectedElement(<CalendarPage />) },
      { path: 'reminders', element: protectedElement(<RemindersPage />) },
      { path: 'documents', element: protectedElement(<DocumentsPage />) },
      { path: 'activity', element: protectedElement(<ActivityPage />) },
      { path: 'analytics', element: protectedElement(<AnalyticsPage />) },
      { path: 'profile', element: protectedElement(<ProfilePage />) },
      { path: 'settings', element: protectedElement(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
