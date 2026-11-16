import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity as ActivityIcon,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Target,
  TrendingDown,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { dataService } from '@/services/data.service'
import { interviewsService } from '@/services/interviews.service'
import { titleCase } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

const CHART_COLORS = ['#B7F36B', '#7DB8F5', '#F2B84B', '#C792EA', '#E76D75', '#5BC8AF', '#929AAA', '#6B7A96']

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  to,
}: {
  label: string
  value: number
  icon: typeof BriefcaseBusiness
  color: string
  to?: string
}) {
  const content = (
    <Card className="p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}22`, color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: dataService.dashboard })
  const analyticsQuery = useQuery({ queryKey: ['analytics'], queryFn: dataService.analytics })
  const interviewsQuery = useQuery({
    queryKey: ['interviews', 'upcoming'],
    queryFn: () => interviewsService.list({ upcoming_only: true, page_size: 5 }),
  })

  if (dashboardQuery.isError) {
    return <ErrorState message="Your dashboard didn't load." onRetry={() => dashboardQuery.refetch()} />
  }

  const summary = dashboardQuery.data
  const analytics = analyticsQuery.data

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${firstName}.`}
        description="Here's the state of your search. Small steps add up."
        action={
          <Button asChild>
            <Link to="/app/applications">View applications</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {summary ? (
          <>
            <StatCard label="Total" value={summary.total_applications} icon={BriefcaseBusiness} color="#B7F36B" to="/app/applications" />
            <StatCard label="Active" value={summary.active_applications} icon={Target} color="#7DB8F5" to="/app/applications?status=applied" />
            <StatCard label="Interviews" value={summary.interviews} icon={CalendarClock} color="#C792EA" to="/app/interviews" />
            <StatCard label="Offers" value={summary.offers} icon={CheckCircle2} color="#5BC8AF" to="/app/applications?status=offer" />
            <StatCard label="Rejections" value={summary.rejections} icon={XCircle} color="#E76D75" to="/app/applications?status=rejected" />
            <StatCard label="Upcoming" value={summary.upcoming_deadlines} icon={TrendingDown} color="#F2B84B" to="/app/calendar" />
          </>
        ) : (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[106px]" />)
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Applications over time</CardTitle>
          </CardHeader>
          <CardContent className="h-64 p-4">
            {analytics ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.applications_over_time} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B7F36B" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#B7F36B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333d51" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#202735', border: '1px solid #333d51', borderRadius: 8, color: '#F4F5F7' }} />
                  <Area type="monotone" dataKey="value" name="Applications" stroke="#B7F36B" fill="url(#areaFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 p-4">
            {analytics && analytics.applications_by_status.length > 0 ? (
              <div className="flex h-full items-center">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie data={analytics.applications_by_status} dataKey="count" nameKey="status" innerRadius="52%" outerRadius="82%" paddingAngle={2}>
                      {analytics.applications_by_status.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#202735', border: '1px solid #333d51', borderRadius: 8, color: '#F4F5F7' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {analytics.applications_by_status.slice(0, 5).map((item, i) => (
                    <div key={item.status} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="flex-1 truncate text-muted">{titleCase(item.status)}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted">Add applications to see the breakdown.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-56 p-4">
            {analytics ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Applied', value: analytics.total_applications },
                    { name: 'Interview', value: analytics.interview_conversion.value },
                    { name: 'Offer', value: analytics.offer_conversion.value },
                    { name: 'Rejected', value: analytics.rejection_rate.value },
                  ]}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333d51" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#202735', border: '1px solid #333d51', borderRadius: 8, color: '#F4F5F7' }} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="value" name="Count" fill="#7DB8F5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming interviews</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {interviewsQuery.data?.items.length ? (
              <div className="space-y-3">
                {interviewsQuery.data.items.map((item) => (
                  <Link key={item.id} to="/app/interviews" className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-2">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted">
                        {new Date(item.interview_date).toLocaleDateString()} · {item.company_name ?? item.application_position ?? 'General'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted">No interviews on the calendar. Yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> Recent activity</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/activity">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          {summary?.recent_activity.length ? (
            <ul className="divide-y divide-border">
              {summary.recent_activity.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-3">
                  <Badge variant="secondary" className="shrink-0">{titleCase(item.type)}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted">{new Date(item.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Nothing here yet. Your first application will start the story.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
