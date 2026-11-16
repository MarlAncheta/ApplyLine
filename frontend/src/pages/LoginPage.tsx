import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { loginSchema, type LoginInput } from '@/schemas'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const { toast } = useToast()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginInput) => {
    setError('')
    try {
      await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/app'
      navigate(from, { replace: true })
      toast("Welcome back. Let's keep the momentum going.", 'success')
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to log in.'))
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New here? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </div>
        )}
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted hover:text-primary">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>
    </AuthShell>
  )
}
