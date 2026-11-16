import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/shared/form-field'
import { DocumentUploadDialog } from '@/components/shared/DocumentUploadDialog'
import { documentsService } from '@/services/documents.service'
import { applicationsService } from '@/services/applications.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { DOCUMENT_CATEGORIES, type CareerDocument } from '@/types'
import { formatBytes, formatDate, titleCase } from '@/lib/utils'

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [category, setCategory] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [renaming, setRenaming] = useState<CareerDocument | null>(null)
  const [newName, setNewName] = useState('')
  const [deleting, setDeleting] = useState<CareerDocument | null>(null)

  const query = useQuery({ queryKey: ['documents'], queryFn: () => documentsService.list(1, 100) })
  const appsQuery = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: () => applicationsService.list({ page_size: 100 }),
  })

  const documents = (query.data?.items ?? []).filter((d) => !category || d.category === category)

  async function handleDownload(doc: CareerDocument) {
    try {
      await documentsService.download(doc.id, doc.original_filename)
      toast('Download started.', 'success')
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  async function handleRename() {
    if (!renaming || !newName.trim()) return
    try {
      await documentsService.update(renaming.id, { original_filename: newName.trim() })
      await queryClient.invalidateQueries()
      toast('Document renamed.', 'success')
      setRenaming(null)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await documentsService.remove(deleting.id)
      await queryClient.invalidateQueries()
      toast('Document deleted.', 'success')
      setDeleting(null)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Your resumes, cover letters, and career artifacts — stored privately."
        action={<Button onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4" /> Upload document</Button>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant={!category ? 'default' : 'outline'} size="sm" onClick={() => setCategory('')}>All</Button>
        {DOCUMENT_CATEGORIES.map((c) => (
          <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{titleCase(c)}</Button>
        ))}
      </div>

      {query.isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data && documents.length === 0 && (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No documents here" description="Upload a resume or cover letter. Files stay private and are only accessible to you." action={<Button onClick={() => setUploadOpen(true)}>Upload document</Button>} />
      )}

      {documents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium" title={doc.original_filename}>{doc.original_filename}</h3>
                    <p className="text-xs text-muted">{formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{titleCase(doc.category)}</Badge>
                {doc.application_ids.length > 0 && <Badge variant="info">{doc.application_ids.length} linked</Badge>}
              </div>
              {doc.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{doc.description}</p>}
              <div className="mt-auto flex items-center gap-1 border-t border-border pt-3">
                <Button size="sm" onClick={() => void handleDownload(doc)}><Download className="h-3.5 w-3.5" /> Download</Button>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => { setRenaming(doc); setNewName(doc.original_filename) }} aria-label="Rename"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(doc)} aria-label="Delete"><Trash2 className="h-4 w-4 text-danger" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} applications={appsQuery.data?.items ?? []} />
      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title={`Delete ${deleting?.original_filename ?? 'document'}?`} description="The file will be removed from storage permanently." onConfirm={handleDelete} />
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename document</DialogTitle></DialogHeader>
          <DialogBody>
            <FormField label="File name" htmlFor="rename-input">
              <Input id="rename-input" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleRename() }} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={() => void handleRename()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
