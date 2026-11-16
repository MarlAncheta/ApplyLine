import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UploadCloud } from 'lucide-react'
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { DOCUMENT_CATEGORIES, type Application } from '@/types'
import { titleCase, formatBytes } from '@/lib/utils'
import { documentsService } from '@/services/documents.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

export function DocumentUploadDialog({
  open, onOpenChange, applications = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applications?: Application[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('resume')
  const [description, setDescription] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleUpload() {
    if (!file) return
    setBusy(true)
    try {
      await documentsService.upload(file, {
        category,
        description: description || undefined,
        applicationIds: applicationId ? [applicationId] : undefined,
      })
      await queryClient.invalidateQueries()
      toast('Document uploaded securely.', 'success')
      setFile(null)
      setDescription('')
      setApplicationId('')
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>Stored privately in the cloud. Only you can access it.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-2/40 px-4 py-8 text-center transition-colors hover:border-primary/50"
          >
            <UploadCloud className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">{file ? file.name : 'Choose a file'}</span>
            <span className="text-xs text-muted">
              {file ? formatBytes(file.size) : 'PDF, Word, text, or images · up to 10 MB'}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" htmlFor="doc-category">
              <select id="doc-category" className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
                {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
              </select>
            </FormField>
            <FormField label="Attach to application" htmlFor="doc-app">
              <select id="doc-app" className="input-base" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
                <option value="">None</option>
                {applications.map((a) => <option key={a.id} value={a.id}>{a.position_title}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description (optional)" htmlFor="doc-desc">
            <Textarea id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Tailored version for startups" />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file} loading={busy}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
