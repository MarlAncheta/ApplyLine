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
import { companySchema, type CompanyInput } from '@/schemas'
import type { Company } from '@/types'
import { companiesService } from '@/services/companies.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

const empty: CompanyInput = {
  name: '', website: '', industry: '', location: '',
  contact_person: '', contact_email: '', notes: '',
}

export function CompanyFormDialog({
  open, onOpenChange, company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({ resolver: zodResolver(companySchema), defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(company ? {
        name: company.name,
        website: company.website ?? '',
        industry: company.industry ?? '',
        location: company.location ?? '',
        contact_person: company.contact_person ?? '',
        contact_email: company.contact_email ?? '',
        notes: company.notes ?? '',
      } : empty)
    }
  }, [company, open, reset])

  const onSubmit = async (values: CompanyInput) => {
    const payload = { ...values, website: values.website || null, contact_email: values.contact_email || null }
    try {
      if (company) {
        await companiesService.update(company.id, payload)
        toast('Company updated.', 'success')
      } else {
        await companiesService.create(payload)
        toast('Company added.', 'success')
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
          <DialogTitle>{company ? 'Edit company' : 'Add a company'}</DialogTitle>
          <DialogDescription>Keep your contacts and context in one place.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <FormField label="Company name" htmlFor="name" error={errors.name?.message} required>
              <Input id="name" placeholder="Acme Inc." {...register('name')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Website" htmlFor="website" error={errors.website?.message}>
                <Input id="website" placeholder="https://acme.com" {...register('website')} />
              </FormField>
              <FormField label="Industry" htmlFor="industry">
                <Input id="industry" placeholder="Technology" {...register('industry')} />
              </FormField>
            </div>
            <FormField label="Location" htmlFor="clocation">
              <Input id="clocation" placeholder="City, Country" {...register('location')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Contact person" htmlFor="contact_person">
                <Input id="contact_person" placeholder="Jamie Lee" {...register('contact_person')} />
              </FormField>
              <FormField label="Contact email" htmlFor="contact_email" error={errors.contact_email?.message}>
                <Input id="contact_email" type="email" placeholder="jamie@acme.com" {...register('contact_email')} />
              </FormField>
            </div>
            <FormField label="Notes" htmlFor="cnotes">
              <Textarea id="cnotes" placeholder="Anything worth remembering…" {...register('notes')} />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{company ? 'Save changes' : 'Add company'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
