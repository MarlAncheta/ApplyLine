import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth,
  startOfWeek, subMonths, subWeeks,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorState, LoadingBlock } from '@/components/ui/feedback'
import { ApplicationDetailDialog } from '@/components/shared/ApplicationDetailDialog'
import { applicationsService } from '@/services/applications.service'
import { interviewsService } from '@/services/interviews.service'
import { remindersService } from '@/services/reminders.service'
import { cn } from '@/lib/utils'

type EventKind = 'interview' | 'follow_up' | 'deadline' | 'reminder'
interface CalEvent {
  id: string
  date: string
  title: string
  kind: EventKind
  recordId: string
}

const KIND_STYLES: Record<EventKind, string> = {
  interview: 'bg-info/15 text-info',
  follow_up: 'bg-primary/15 text-primary',
  deadline: 'bg-warning/15 text-warning',
  reminder: 'bg-primary/10 text-primary',
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [anchor, setAnchor] = useState(new Date())
  const [detailId, setDetailId] = useState<string | null>(null)

  const appsQuery = useQuery({ queryKey: ['applications', 'all'], queryFn: () => applicationsService.list({ page_size: 100 }) })
  const interviewsQuery = useQuery({ queryKey: ['interviews', 'all'], queryFn: () => interviewsService.list({ page_size: 100 }) })
  const remindersQuery = useQuery({ queryKey: ['reminders', 'all'], queryFn: () => remindersService.list(undefined, 1, 100) })

  const events = useMemo<CalEvent[]>(() => {
    const result: CalEvent[] = []
    for (const app of appsQuery.data?.items ?? []) {
      if (app.follow_up_date) {
        result.push({ id: `fu-${app.id}`, date: app.follow_up_date, title: app.position_title, kind: 'follow_up', recordId: app.id })
      }
    }
    for (const interview of interviewsQuery.data?.items ?? []) {
      if (!interview.cancelled) {
        result.push({ id: `iv-${interview.id}`, date: interview.interview_date, title: interview.title, kind: 'interview', recordId: interview.id })
      }
    }
    for (const reminder of remindersQuery.data?.items ?? []) {
      if (!reminder.completed) {
        result.push({
          id: `rm-${reminder.id}`,
          date: reminder.due_at.slice(0, 10),
          title: reminder.title,
          kind: reminder.category === 'deadline' ? 'deadline' : 'reminder',
          recordId: reminder.id,
        })
      }
    }
    return result
  }, [appsQuery.data, interviewsQuery.data, remindersQuery.data])

  const days = useMemo(() => {
    if (view === 'month') {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(anchor)),
        end: endOfWeek(endOfMonth(anchor)),
      })
    }
    return eachDayOfInterval({ start: startOfWeek(anchor), end: endOfWeek(anchor) })
  }, [anchor, view])

  function handleEvent(event: CalEvent) {
    if (event.kind === 'follow_up') {
      setDetailId(event.recordId)
    } else if (event.kind === 'interview') {
      navigate('/app/interviews')
    } else {
      navigate('/app/reminders')
    }
  }

  const isLoading = appsQuery.isLoading || interviewsQuery.isLoading || remindersQuery.isLoading
  const isError = appsQuery.isError || interviewsQuery.isError || remindersQuery.isError

  function shift(direction: 1 | -1) {
    setAnchor((current) => view === 'month'
      ? (direction === 1 ? addMonths(current, 1) : subMonths(current, 1))
      : (direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1)))
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Interviews, follow-ups, and deadlines — all on one timeline."
        action={
          <>
            <div className="flex rounded-lg border border-border p-0.5">
              <Button variant={view === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setView('month')}>Month</Button>
              <Button variant={view === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setView('week')}>Week</Button>
            </div>
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-info/60" /> Interviews</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/60" /> Follow-ups</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-warning/60" /> Deadlines</span>
      </div>

      {isLoading && <LoadingBlock label="Loading your calendar…" />}
      {isError && <ErrorState onRetry={() => { void appsQuery.refetch(); void interviewsQuery.refetch(); void remindersQuery.refetch() }} />}

      {!isLoading && !isError && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-center text-lg font-semibold">
            {view === 'month' ? format(anchor, 'MMMM yyyy') : `${format(startOfWeek(anchor), 'MMM d')} – ${format(endOfWeek(anchor), 'MMM d, yyyy')}`}
          </div>
          <div className="grid grid-cols-7 border-b border-border bg-surface-2/40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), day))
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[92px] border-b border-r border-border p-1.5 sm:min-h-[120px] sm:p-2',
                    !isSameMonth(day, anchor) && view === 'month' && 'bg-background/40 opacity-50',
                  )}
                >
                  <span className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday(day) ? 'bg-primary font-bold text-background' : 'text-muted',
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEvent(event)}
                        className={cn('block w-full truncate rounded px-1.5 py-1 text-left text-[11px] hover:brightness-125', KIND_STYLES[event.kind])}
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && <p className="px-1 text-[10px] text-muted">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {!isLoading && events.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted"><CalendarDays className="h-4 w-4" /> No events yet. Add interviews, follow-up dates, or reminders to fill the calendar.</p>
      )}

      <ApplicationDetailDialog applicationId={detailId} open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </div>
  )
}
