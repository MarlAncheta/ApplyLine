import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Clock, CalendarDays, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { profileSchema, type ProfileInput } from '@/schemas'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { extractErrorMessage } from '@/services/api'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const { toast } = useToast()
  const [error, setError] = useState('')

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? '', timezone: user?.timezone ?? 'UTC' },
  })

  const onSubmit = async (values: ProfileInput) => {
    setError('')
    try {
      await updateProfile(values)
      reset(values)
      toast('Profile updated.', 'success')
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description="Your account details and preferences." />

      <Card className="mb-5">
        <CardHeader><CardTitle>Account overview</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.full_name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted"><Mail className="h-3.5 w-3.5" /> {user?.email}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-sm text-muted"><CalendarDays className="h-4 w-4 text-primary" /> Joined {formatDate(user?.created_at)}</div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-sm text-muted"><Clock className="h-4 w-4 text-primary" /> {user?.timezone}</div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-sm text-muted"><ShieldCheck className="h-4 w-4 text-primary" /> {user?.is_verified ? 'Verified' : 'Active account'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</div>}
            <FormField label="Full name" htmlFor="pf-name" error={errors.full_name?.message} required>
              <Input id="pf-name" {...register('full_name')} />
            </FormField>
            <FormField label="Timezone" htmlFor="pf-tz" error={errors.timezone?.message} hint="Used for interviews, reminders, and calendar events.">
              <Input id="pf-tz" {...register('timezone')} />
            </FormField>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
