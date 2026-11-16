import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { InterviewFormDialog } from '@/components/shared/InterviewFormDialog'
import { interviewsService } from '@/services/interviews.service'
import { applicationsService } from '@/services/applications.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { titleCase } from '@/lib/utils'
import type { Interview } from '@/types'

export default function InterviewsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)
  const [deleting, setDeleting] = useState<Interview | null>(null)

  const query = useQuery({
    queryKey: ['interviews', upcomingOnly],
    queryFn: () => interviewsService.list({ upcoming_only: upcomingOnly, page_size: 100 }),
  })
  const appsQuery = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: () => applicationsService.list({ page_size: 100 }),
  })

  async function handleDelete() {
    if (!deleting) return
    try {
      await interviewsService.remove(deleting.id)
      await queryClient.invalidateQueries()
      toast('Interview removed.', 'success')
      setDeleting(null)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  async function toggleCancelled(interview: Interview) {
    try {
      await interviewsService.update(interview.id, { cancelled: !interview.cancelled })
      await queryClient.invalidateQueries()
      toast(interview.cancelled ? 'Interview restored.' : 'Interview cancelled.', 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Every conversation on your calendar, with notes to match."
        action={<Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> Schedule interview</Button>}
      />

      <div className="mb-5 flex gap-2">
        <Button variant={!upcomingOnly ? 'default' : 'outline'} size="sm" onClick={() => setUpcomingOnly(false)}>All</Button>
        <Button variant={upcomingOnly ? 'default' : 'outline'} size="sm" onClick={() => setUpcomingOnly(true)}>Upcoming</Button>
      </div>

      {query.isLoading && <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.items.length === 0 && (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No interviews here" description="Schedule one and we'll help you keep track of the details." action={<Button onClick={() => setFormOpen(true)}>Schedule interview</Button>} />
      )}

      {query.data && query.data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.items.map((interview) => (
            <Card key={interview.id} className={`p-5 ${interview.cancelled ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{interview.title}</h3>
                  <p className="truncate text-sm text-muted">
                    {interview.company_name ?? interview.application_position ?? 'No linked application'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(interview); setFormOpen(true) }} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(interview)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="info">{new Date(interview.interview_date).toLocaleDateString()}</Badge>
                {interview.start_time && <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{interview.start_time.slice(0, 5)} {interview.timezone}</Badge>}
                <Badge variant="secondary">{titleCase(interview.interview_type)}</Badge>
                {interview.cancelled && <Badge variant="danger">Cancelled</Badge>}
                {!interview.cancelled && <Badge variant={interview.outcome === 'passed' ? 'success' : interview.outcome === 'failed' ? 'danger' : 'secondary'}>{titleCase(interview.outcome)}</Badge>}
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted">
                {interview.interviewer && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" /> {interview.interviewer}</p>}
                {interview.location && <p className="flex items-center gap-2 break-all"><MapPin className="h-3.5 w-3.5 shrink-0" /> {interview.location}</p>}
              </div>
              {interview.preparation_notes && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-muted">{interview.preparation_notes}</p>}
              <div className="mt-4 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => void toggleCancelled(interview)}>
                  {interview.cancelled ? 'Restore interview' : 'Cancel interview'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <InterviewFormDialog open={formOpen} onOpenChange={setFormOpen} interview={editing} applications={appsQuery.data?.items ?? []} />
      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Delete this interview?" description="This removes the interview and its notes permanently." onConfirm={handleDelete} />
    </div>
  )
}
