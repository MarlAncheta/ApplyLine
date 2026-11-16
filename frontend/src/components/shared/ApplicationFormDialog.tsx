import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { applicationSchema, type ApplicationInput } from '@/schemas'
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  PRIORITIES,
  WORK_ARRANGEMENTS,
  type Application,
  type Company,
} from '@/types'
import { titleCase } from '@/lib/utils'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { applicationsService } from '@/services/applications.service'
import { useQueryClient } from '@tanstack/react-query'

const emptyValues: ApplicationInput = {
  company_id: '',
  position_title: '',
  job_description: '',
  job_posting_url: '',
  employment_type: 'full_time',
  work_arrangement: 'remote',
  location: '',
  salary: '',
  date_discovered: '',
  date_applied: '',
  status: 'interested',
  priority: 'medium',
  notes: '',
  follow_up_date: '',
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  companies = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: Application | null
  companies?: Company[]
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema), defaultValues: emptyValues })

  useEffect(() => {
    if (open) {
      reset(
        application
          ? {
              company_id: application.company_id ?? '',
              position_title: application.position_title,
              job_description: application.job_description ?? '',
              job_posting_url: application.job_posting_url ?? '',
              employment_type: application.employment_type,
              work_arrangement: application.work_arrangement,
              location: application.location ?? '',
              salary: application.salary ?? '',
              date_discovered: application.date_discovered ?? '',
              date_applied: application.date_applied ?? '',
              status: application.status,
              priority: application.priority,
              notes: application.notes ?? '',
              follow_up_date: application.follow_up_date ?? '',
            }
          : emptyValues,
      )
    }
  }, [application, open, reset])

  const onSubmit = async (values: ApplicationInput) => {
    const payload: Record<string, unknown> = {
      ...values,
      company_id: values.company_id || null,
      job_posting_url: values.job_posting_url || null,
      date_discovered: values.date_discovered || null,
      date_applied: values.date_applied || null,
      follow_up_date: values.follow_up_date || null,
    }
    try {
      if (application) {
        await applicationsService.update(application.id, payload)
        toast('Application updated.', 'success')
      } else {
        await applicationsService.create(payload)
        toast('Application added. The hunt is on.', 'success')
      }
      await queryClient.invalidateQueries()
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application ? 'Edit application' : 'Add an application'}</DialogTitle>
          <DialogDescription>Log the details that matter to you. You can change them anytime.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Position title" htmlFor="position_title" error={errors.position_title?.message} required>
                <Input id="position_title" placeholder="Software Engineer" {...register('position_title')} />
              </FormField>
              <FormField label="Company" htmlFor="company_id">
                <select id="company_id" className="input-base" {...register('company_id')}>
                  <option value="">No company</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Status" htmlFor="status">
                <select id="status" className="input-base" {...register('status')}>
                  {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </FormField>
              <FormField label="Priority" htmlFor="priority">
                <select id="priority" className="input-base" {...register('priority')}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Employment type" htmlFor="employment_type">
                <select id="employment_type" className="input-base" {...register('employment_type')}>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </FormField>
              <FormField label="Work arrangement" htmlFor="work_arrangement">
                <select id="work_arrangement" className="input-base" {...register('work_arrangement')}>
                  {WORK_ARRANGEMENTS.map((w) => <option key={w} value={w}>{titleCase(w)}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Location" htmlFor="location"><Input id="location" placeholder="Remote / City" {...register('location')} /></FormField>
              <FormField label="Compensation" htmlFor="salary"><Input id="salary" placeholder="$90k – $110k" {...register('salary')} /></FormField>
            </div>
            <FormField label="Job posting URL" htmlFor="job_posting_url" error={errors.job_posting_url?.message}>
              <Input id="job_posting_url" type="url" placeholder="https://…" {...register('job_posting_url')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Date discovered" htmlFor="date_discovered"><Input id="date_discovered" type="date" {...register('date_discovered')} /></FormField>
              <FormField label="Date applied" htmlFor="date_applied"><Input id="date_applied" type="date" {...register('date_applied')} /></FormField>
              <FormField label="Follow-up date" htmlFor="follow_up_date"><Input id="follow_up_date" type="date" {...register('follow_up_date')} /></FormField>
            </div>
            <FormField label="Job description" htmlFor="job_description">
              <Textarea id="job_description" placeholder="Key details from the posting…" {...register('job_description')} />
            </FormField>
            <FormField label="Notes" htmlFor="notes">
              <Textarea id="notes" placeholder="Your thoughts, contacts, anything worth remembering…" {...register('notes')} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{application ? 'Save changes' : 'Add application'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
