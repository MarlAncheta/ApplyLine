import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingBlock } from '@/components/ui/feedback'
import { PriorityBadge } from '@/components/shared/status-badge'
import { ApplicationFormDialog } from '@/components/shared/ApplicationFormDialog'
import { ApplicationDetailDialog } from '@/components/shared/ApplicationDetailDialog'
import { applicationsService } from '@/services/applications.service'
import { companiesService } from '@/services/companies.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatDate, titleCase } from '@/lib/utils'
import { APPLICATION_STATUSES, type Application } from '@/types'

export default function BoardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const boardQuery = useQuery({ queryKey: ['board'], queryFn: applicationsService.board })
  const companiesQuery = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companiesService.list(undefined, 1, 100),
  })

  async function moveTo(application: Application, status: string) {
    if (application.status === status) return
    setBusyId(application.id)
    try {
      await applicationsService.changeStatus(application.id, status)
      await queryClient.invalidateQueries()
      toast(`Moved to ${titleCase(status)}.`, 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const applications = boardQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Kanban board"
        description="Drag a card to a new stage, or use the menu on the card. Either way, we save it."
        action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add application</Button>}
      />

      {boardQuery.isLoading && <LoadingBlock label="Building your board…" />}
      {boardQuery.isError && <ErrorState onRetry={() => boardQuery.refetch()} />}

      {boardQuery.data && (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4">
            {APPLICATION_STATUSES.map((status) => {
              const cards = applications.filter((a) => a.status === status)
              return (
                <section
                  key={status}
                  onDragOver={(e) => { e.preventDefault(); setOverColumn(status) }}
                  onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
                  onDrop={(e) => {
                    e.preventDefault()
                    setOverColumn(null)
                    const id = e.dataTransfer.getData('text/plain') || dragging
                    const app = applications.find((a) => a.id === id)
                    if (app) void moveTo(app, status)
                    setDragging(null)
                  }}
                  className={`flex w-[268px] shrink-0 flex-col rounded-xl border bg-surface/50 transition-colors ${
                    overColumn === status ? 'border-primary/60 bg-primary/5' : 'border-border'
                  }`}
                  aria-label={`${titleCase(status)} column`}
                >
                  <header className="flex items-center justify-between border-b border-border px-3 py-3">
                    <h2 className="text-sm font-semibold">{titleCase(status)}</h2>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{cards.length}</span>
                  </header>
                  <div className="flex min-h-[160px] flex-1 flex-col gap-2 p-2">
                    {cards.map((app) => (
                      <article
                        key={app.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', app.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDragging(app.id)
                        }}
                        onDragEnd={() => { setDragging(null); setOverColumn(null) }}
                        className={`group rounded-lg border border-border bg-surface p-3 shadow-sm transition-opacity hover:border-primary/40 ${
                          dragging === app.id ? 'opacity-40' : ''
                        } ${busyId === app.id ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted/50" aria-hidden="true" />
                          <button onClick={() => setDetailId(app.id)} className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-medium hover:text-primary">{app.position_title}</p>
                            <p className="truncate text-xs text-muted">{app.company?.name ?? 'No company'}</p>
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <PriorityBadge priority={app.priority} />
                          <span className="text-[11px] text-muted">{formatDate(app.date_applied ?? app.created_at)}</span>
                        </div>
                        <div className="mt-3 border-t border-border pt-2">
                          <label className="sr-only" htmlFor={`status-${app.id}`}>Change status</label>
                          <select
                            id={`status-${app.id}`}
                            value={app.status}
                            onChange={(e) => void moveTo(app, e.target.value)}
                            className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted focus:border-primary focus:outline-none"
                          >
                            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                          </select>
                        </div>
                      </article>
                    ))}
                    {cards.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                        Drop a card here
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      <ApplicationFormDialog open={formOpen} onOpenChange={setFormOpen} companies={companiesQuery.data?.items ?? []} />
      <ApplicationDetailDialog applicationId={detailId} open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </div>
  )
}
