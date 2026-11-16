import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { passwordSchema, type PasswordInput } from '@/schemas'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { extractErrorMessage } from '@/services/api'

export default function SettingsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) })

  const onSubmit = async (values: PasswordInput) => {
    setError('')
    setMessage('')
    try {
      await authService.changePassword(values.current_password, values.new_password)
      reset()
      setMessage('Password changed. All other sessions have been signed out.')
      toast('Password updated.', 'success')
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Security and account controls." />

      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</div>}
            {message && <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary" role="status">{message}</div>}
            <FormField label="Current password" htmlFor="cur-pw" error={errors.current_password?.message} required>
              <Input id="cur-pw" type="password" autoComplete="current-password" {...register('current_password')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="New password" htmlFor="new-pw" error={errors.new_password?.message} required>
                <Input id="new-pw" type="password" autoComplete="new-password" {...register('new_password')} />
              </FormField>
              <FormField label="Confirm new password" htmlFor="conf-pw" error={errors.confirm_password?.message} required>
                <Input id="conf-pw" type="password" autoComplete="new-password" {...register('confirm_password')} />
              </FormField>
            </div>
            <Button type="submit" loading={isSubmitting}>Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Passwords are hashed with Argon2. Sessions use short-lived access tokens and rotating refresh tokens stored in secure cookies.</p>
          <p>Forgot-password requests never reveal whether an account exists.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Session</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void handleLogout()}><LogOut className="h-4 w-4" /> Log out of this account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
