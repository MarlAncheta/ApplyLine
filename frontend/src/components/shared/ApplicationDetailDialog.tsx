import { useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ApplicationFormDialog } from './ApplicationFormDialog'
import { applicationsService } from '@/services/applications.service'
import { dataService } from '@/services/data.service'
import { formatDate, titleCase } from '@/lib/utils'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { APPLICATION_STATUSES } from '@/types'

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-text">{value || 'N/A'}</dd>
    </div>
  )
}

export function ApplicationDetailDialog({
  applicationId,
  open,
  onOpenChange,
}: {
  applicationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsService.get(applicationId!),
    enabled: !!applicationId && open,
  })
  const { data: activities } = useQuery({
    queryKey: ['activities', applicationId],
    queryFn: async () => (await dataService.activities(1, 100)).items.filter((a) => a.application_id === applicationId),
    enabled: !!applicationId && open,
  })

  async function changeStatus(status: string) {
    if (!application) return
    setBusy(true)
    try {
      await applicationsService.changeStatus(application.id, status)
      await queryClient.invalidateQueries()
      toast('Status updated.', 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function toggleArchive() {
    if (!application) return
    setBusy(true)
    try {
      await applicationsService.setArchived(application.id, !application.archived)
      await queryClient.invalidateQueries()
      toast(application.archived ? 'Application restored.' : 'Application archived.', 'success')
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!application) return
    try {
      await applicationsService.remove(application.id)
      await queryClient.invalidateQueries()
      toast('Application deleted.', 'success')
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <div>
              <DialogTitle>{application?.position_title ?? 'Application'}</DialogTitle>
              {application?.company && <p className="mt-1 text-sm text-muted">{application.company.name}</p>}
            </div>
            <div className="flex gap-2 pr-8">
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit" disabled={!application}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete" disabled={!application}>
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          </DialogHeader>
          <DialogBody>
            {isLoading && <p className="py-10 text-center text-sm text-muted">Loading details…</p>}
            {isError && <p className="py-10 text-center text-sm text-danger">Could not load this application.</p>}
            {application && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={application.status} />
                  <PriorityBadge priority={application.priority} />
                  <Badge variant="secondary">{titleCase(application.employment_type)}</Badge>
                  <Badge variant="secondary">{titleCase(application.work_arrangement)}</Badge>
                  {application.archived && <Badge variant="warning">Archived</Badge>}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Quick status change</p>
                  <div className="flex flex-wrap gap-1.5">
                    {APPLICATION_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => changeStatus(status)}
                        disabled={busy || status === application.status}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          status === application.status
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border text-muted hover:border-primary/50 hover:text-text'
                        }`}
                      >
                        {titleCase(status)}
                      </button>
                    ))}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Detail label="Location" value={application.location} />
                  <Detail label="Compensation" value={application.salary} />
                  <Detail label="Date discovered" value={formatDate(application.date_discovered)} />
                  <Detail label="Date applied" value={formatDate(application.date_applied)} />
                  <Detail label="Follow-up" value={formatDate(application.follow_up_date)} />
                  <Detail label="Added" value={formatDate(application.created_at)} />
                </dl>

                {application.job_posting_url && (
                  <a
                    href={application.job_posting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    View original posting <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {application.job_description && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Description</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{application.job_description}</p>
                  </div>
                )}
                {application.notes && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Notes</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{application.notes}</p>
                  </div>
                )}

                {application.documents.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Attached documents</p>
                    <div className="flex flex-wrap gap-2">
                      {application.documents.map((doc) => (
                        <Badge key={doc.id} variant="secondary">{doc.original_filename}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activities && activities.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">History</p>
                    <ul className="space-y-2 border-l border-border pl-4">
                      {activities.slice(0, 8).map((activity) => (
                        <li key={activity.id} className="relative text-sm">
                          <span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-primary" />
                          <span className="text-text">{activity.title}</span>
                          <span className="ml-2 text-xs text-muted">{formatDate(activity.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={toggleArchive} loading={busy} disabled={!application}>
              {application?.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {application?.archived ? 'Restore' : 'Archive'}
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicationFormDialog
        open={editing}
        onOpenChange={setEditing}
        application={application}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this application?"
        description="This also removes its interviews and activity history. This cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
