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
import { interviewSchema, type InterviewInput } from '@/schemas'
import {
  INTERVIEW_TYPES, type Application, type Interview,
} from '@/types'
import { titleCase } from '@/lib/utils'
import { interviewsService } from '@/services/interviews.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

function localDate(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export function InterviewFormDialog({
  open, onOpenChange, interview, applications = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview?: Interview | null
  applications?: Application[]
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<InterviewInput>({ resolver: zodResolver(interviewSchema) })

  useEffect(() => {
    if (open) {
      reset(interview ? {
        application_id: interview.application_id ?? '',
        title: interview.title,
        interview_date: interview.interview_date,
        start_time: interview.start_time?.slice(0, 5) ?? '',
        timezone: interview.timezone,
        interview_type: interview.interview_type,
        location: interview.location ?? '',
        interviewer: interview.interviewer ?? '',
        preparation_notes: interview.preparation_notes ?? '',
        outcome: interview.outcome,
        feedback: interview.feedback ?? '',
      } : {
        application_id: '', title: '', interview_date: localDate(), start_time: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        interview_type: 'video', location: '', interviewer: '',
        preparation_notes: '', outcome: 'pending', feedback: '',
      })
    }
  }, [interview, open, reset])

  const onSubmit = async (values: InterviewInput) => {
    const payload = {
      ...values,
      application_id: values.application_id || null,
      start_time: values.start_time ? `${values.start_time}:00` : null,
    }
    try {
      if (interview) {
        await interviewsService.update(interview.id, payload)
        toast('Interview updated.', 'success')
      } else {
        await interviewsService.create(payload)
        toast('Interview scheduled.', 'success')
      }
      await queryClient.invalidateQueries()
      onOpenChange(false)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{interview ? 'Edit interview' : 'Schedule an interview'}</DialogTitle>
          <DialogDescription>We store the date, time, and timezone separately so nothing shifts unexpectedly.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <FormField label="Title" htmlFor="ititle" error={errors.title?.message} required>
              <Input id="ititle" placeholder="Technical screen" {...register('title')} />
            </FormField>
            <FormField label="Related application" htmlFor="iapplication">
              <select id="iapplication" className="input-base" {...register('application_id')}>
                <option value="">No application</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.position_title}{a.company ? ` (${a.company.name})` : ''}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" htmlFor="idate" error={errors.interview_date?.message} required>
                <Input id="idate" type="date" {...register('interview_date')} />
              </FormField>
              <FormField label="Start time" htmlFor="itime">
                <Input id="itime" type="time" {...register('start_time')} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Timezone" htmlFor="itz" error={errors.timezone?.message} required>
                <Input id="itz" placeholder="UTC" {...register('timezone')} />
              </FormField>
              <FormField label="Type" htmlFor="itype">
                <select id="itype" className="input-base" {...register('interview_type')}>
                  {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Meeting URL or location" htmlFor="ilocation">
              <Input id="ilocation" placeholder="https://meet.example.com or 123 Main St" {...register('location')} />
            </FormField>
            <FormField label="Interviewer" htmlFor="iinterviewer">
              <Input id="iinterviewer" placeholder="Who you'll meet" {...register('interviewer')} />
            </FormField>
            <FormField label="Preparation notes" htmlFor="iprep">
              <Textarea id="iprep" placeholder="Topics to review, questions to ask…" {...register('preparation_notes')} />
            </FormField>
            {interview && (
              <>
                <FormField label="Outcome" htmlFor="ioutcome">
                  <select id="ioutcome" className="input-base" {...register('outcome')}>
                    {['pending', 'passed', 'failed', 'cancelled'].map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
                  </select>
                </FormField>
                <FormField label="Feedback" htmlFor="ifeedback">
                  <Textarea id="ifeedback" placeholder="How did it go?" {...register('feedback')} />
                </FormField>
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{interview ? 'Save changes' : 'Schedule'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
