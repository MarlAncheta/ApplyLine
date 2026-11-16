import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { extractErrorMessage } from '@/services/api'
import { registerSchema, type RegisterInput } from '@/schemas'

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney']

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const { toast } = useToast()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  })

  const onSubmit = async (values: RegisterInput) => {
    setError('')
    try {
      await registerUser({
        email: values.email,
        full_name: values.full_name,
        password: values.password,
        timezone: values.timezone,
      })
      navigate('/app', { replace: true })
      toast('Account created. Your search starts now.', 'success')
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to create your account.'))
    }
  }

  return (
    <AuthShell
      title="Start your search"
      subtitle="Free, private, and refreshingly organized."
      footer={
        <>
          Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </div>
        )}
        <FormField label="Full name" htmlFor="full_name" error={errors.full_name?.message} required>
          <Input id="full_name" autoComplete="name" placeholder="Alex Rivera" {...register('full_name')} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
            <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} />
          </FormField>
          <FormField label="Confirm" htmlFor="confirm_password" error={errors.confirm_password?.message} required>
            <Input id="confirm_password" type="password" autoComplete="new-password" placeholder="Repeat password" {...register('confirm_password')} />
          </FormField>
        </div>
        <FormField label="Timezone" htmlFor="timezone" error={errors.timezone?.message} hint="Used for interviews, reminders, and calendar events.">
          <select id="timezone" className="input-base" {...register('timezone')}>
            {[...new Set([Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', ...TIMEZONES])].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </FormField>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
