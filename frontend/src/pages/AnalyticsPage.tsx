import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Activity, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { dataService } from '@/services/data.service'
import { titleCase } from '@/lib/utils'

const COLORS = ['#B7F36B', '#7DB8F5', '#F2B84B', '#C792EA', '#E76D75', '#5BC8AF', '#929AAA', '#6B7A96']
const tooltipStyle = { background: '#202735', border: '1px solid #333d51', borderRadius: 8, color: '#F4F5F7' }

function RateCard({ label, rate, value, color }: { label: string; rate: number | null; value: number; color: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: rate === null ? undefined : color }}>
        {rate === null ? '—' : `${rate}%`}
      </p>
      <p className="mt-1 text-xs text-muted">{value} {value === 1 ? 'application' : 'applications'}</p>
    </Card>
  )
}

export default function AnalyticsPage() {
  const query = useQuery({ queryKey: ['analytics'], queryFn: dataService.analytics })

  if (query.isError) return <ErrorState message="Analytics didn't load." onRetry={() => query.refetch()} />
  const data = query.data

  return (
    <div>
      <PageHeader title="Analytics" description="Clear metrics from your own data — no smoke, no mirrors." />

      {data?.insufficient_data && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Add at least 3 applications to unlock percentage metrics. Until then, we show counts instead of potentially misleading rates.</p>
        </div>
      )}

      {!data && <div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RateCard label="Interview conversion" rate={data.interview_conversion.rate} value={data.interview_conversion.value} color="#7DB8F5" />
            <RateCard label="Offer conversion" rate={data.offer_conversion.rate} value={data.offer_conversion.value} color="#B7F36B" />
            <RateCard label="Rejection rate" rate={data.rejection_rate.rate} value={data.rejection_rate.value} color="#E76D75" />
            <Card className="p-5">
              <p className="text-sm text-muted">Avg. response time</p>
              <p className="mt-2 text-3xl font-bold">{data.average_response_days === null ? '—' : `${data.average_response_days}d`}</p>
              <p className="mt-1 text-xs text-muted">Requires 3+ responses</p>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Applications over time</CardTitle></CardHeader>
              <CardContent className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.applications_over_time} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333d51" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="value" name="Applications" stroke="#B7F36B" strokeWidth={2} dot={{ r: 3, fill: '#B7F36B' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Applications by status</CardTitle></CardHeader>
              <CardContent className="h-72 p-4">
                {data.applications_by_status.length > 0 ? (
                  <div className="flex h-full items-center">
                    <ResponsiveContainer width="55%" height="100%">
                      <PieChart>
                        <Pie data={data.applications_by_status} dataKey="count" nameKey="status" innerRadius="50%" outerRadius="82%" paddingAngle={2}>
                          {data.applications_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {data.applications_by_status.map((item, i) => (
                        <div key={item.status} className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-muted">{titleCase(item.status)}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-muted">No data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-5">
            <CardHeader><CardTitle>Funnel comparison</CardTitle></CardHeader>
            <CardContent className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Interview', value: data.interview_conversion.value },
                    { name: 'Offer', value: data.offer_conversion.value },
                    { name: 'Rejected', value: data.rejection_rate.value },
                  ]}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333d51" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="value" name="Count" fill="#7DB8F5" radius={[4, 4, 0, 0]}>
                    {['#7DB8F5', '#B7F36B', '#E76D75'].map((color, i) => <Cell key={i} fill={color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> How these numbers are defined</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p><strong className="text-text">Interview conversion</strong> — applications currently at Interview status or with at least one interview, divided by total applications.</p>
              <p><strong className="text-text">Offer conversion</strong> — applications at Offer status divided by total applications.</p>
              <p><strong className="text-text">Rejection rate</strong> — applications at Rejected status divided by total applications.</p>
              <p><strong className="text-text">Average response time</strong> — average days from the applied date to the first status change away from Applied. Shown only when at least 3 responses exist.</p>
              <p><strong className="text-text">Applications over time</strong> — applications created in each of the last 6 months.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
