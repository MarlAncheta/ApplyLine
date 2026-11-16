import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { reminderSchema, type ReminderInput } from '@/schemas'
import { REMINDER_CATEGORIES, type Application, type Reminder } from '@/types'
import { titleCase } from '@/lib/utils'
import { remindersService } from '@/services/reminders.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

function localDateTime(): string {
  const d = new Date(Date.now() + 86400000)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

export function ReminderFormDialog({
  open, onOpenChange, reminder, applications = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder | null
  applications?: Application[]
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<ReminderInput>({ resolver: zodResolver(reminderSchema) })

  useEffect(() => {
    if (open) {
      reset(reminder ? {
        application_id: reminder.application_id ?? '',
        title: reminder.title,
        description: reminder.description ?? '',
        due_at: new Date(reminder.due_at).toISOString().slice(0, 16),
        category: reminder.category,
      } : {
        application_id: '', title: '', description: '',
        due_at: localDateTime(), category: 'follow_up',
      })
    }
  }, [reminder, open, reset])

  const onSubmit = async (values: ReminderInput) => {
    const payload = { ...values, application_id: values.application_id || null }
    try {
      if (reminder) {
        await remindersService.update(reminder.id, payload)
        toast('Reminder updated.', 'success')
      } else {
        await remindersService.create(payload)
        toast("Reminder created. We'll nudge you.", 'success')
      }
      await queryClient.invalidateQueries()
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reminder ? 'Edit reminder' : 'New reminder'}</DialogTitle>
          <DialogDescription>A nudge for the things you don't want to forget.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <FormField label="Title" htmlFor="rtitle" error={errors.title?.message} required>
              <Input id="rtitle" placeholder="Follow up with recruiter" {...register('title')} />
            </FormField>
            <FormField label="Related application" htmlFor="rapp">
              <select id="rapp" className="input-base" {...register('application_id')}>
                <option value="">No application</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>{a.position_title}{a.company ? ` (${a.company.name})` : ''}</option>
                ))}
              </select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date & time" htmlFor="rdue" error={errors.due_at?.message} required>
                <Input id="rdue" type="datetime-local" {...register('due_at')} />
              </FormField>
              <FormField label="Category" htmlFor="rcategory">
                <select id="rcategory" className="input-base" {...register('category')}>
                  {REMINDER_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Description" htmlFor="rdesc">
              <Textarea id="rdesc" placeholder="What needs doing?" {...register('description')} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{reminder ? 'Save changes' : 'Create reminder'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
