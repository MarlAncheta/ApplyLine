import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Check, Circle, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ReminderFormDialog } from '@/components/shared/ReminderFormDialog'
import { remindersService } from '@/services/reminders.service'
import { applicationsService } from '@/services/applications.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatDate, titleCase } from '@/lib/utils'
import type { Reminder } from '@/types'

export default function RemindersPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showCompleted, setShowCompleted] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [deleting, setDeleting] = useState<Reminder | null>(null)

  const query = useQuery({
    queryKey: ['reminders', showCompleted],
    queryFn: () => remindersService.list(showCompleted ? undefined : false, 1, 100),
  })
  const appsQuery = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: () => applicationsService.list({ page_size: 100 }),
  })

  async function toggleComplete(reminder: Reminder) {
    try {
      await remindersService.update(reminder.id, { completed: !reminder.completed })
      await queryClient.invalidateQueries()
      toast(reminder.completed ? 'Reminder reopened.' : 'Nice. One less thing to remember.', 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await remindersService.remove(deleting.id)
      await queryClient.invalidateQueries()
      toast('Reminder deleted.', 'success')
      setDeleting(null)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  const reminders = query.data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Little nudges so nothing important slips through the cracks."
        action={<Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> New reminder</Button>}
      />

      <div className="mb-5 flex gap-2">
        <Button variant={!showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(false)}>Open</Button>
        <Button variant={showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(true)}>All</Button>
      </div>

      {query.isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.items.length === 0 && (
        <EmptyState icon={<BellRing className="h-6 w-6" />} title="No reminders" description="Create a nudge for a follow-up, interview prep, or a deadline." action={<Button onClick={() => setFormOpen(true)}>New reminder</Button>} />
      )}

      {reminders.length > 0 && (
        <Card className="divide-y divide-border">
          {reminders.map((reminder) => (
            <div key={reminder.id} className={`flex items-start gap-3 px-4 py-4 ${reminder.completed ? 'opacity-60' : ''}`}>
              <button
                onClick={() => void toggleComplete(reminder)}
                className="mt-0.5 shrink-0 rounded-full p-0.5 text-muted transition-colors hover:text-primary"
                aria-label={reminder.completed ? 'Reopen reminder' : 'Complete reminder'}
              >
                {reminder.completed ? <Check className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${reminder.completed ? 'line-through' : ''}`}>{reminder.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{formatDate(reminder.due_at, true)}</span>
                  <Badge variant="secondary">{titleCase(reminder.category)}</Badge>
                  {reminder.application_position && <span>· {reminder.application_position}</span>}
                </div>
                {reminder.description && <p className="mt-1.5 text-sm text-muted">{reminder.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(reminder); setFormOpen(true) }} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(reminder)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <ReminderFormDialog open={formOpen} onOpenChange={setFormOpen} reminder={editing} applications={appsQuery.data?.items ?? []} />
      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Delete this reminder?" onConfirm={handleDelete} />
    </div>
  )
}
