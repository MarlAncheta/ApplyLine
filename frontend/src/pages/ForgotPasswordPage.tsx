import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { authService } from '@/services/auth.service'
import { extractErrorMessage } from '@/services/api'

const schema = z.object({ email: z.string().email('Enter a valid email address') })
type Input = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Input) => {
    setError('')
    try {
      setMessage(await authService.forgotPassword(values.email))
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll let you know what happens next."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to log in</Link>}
    >
      {message ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary" role="status">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</div>}
          <p className="text-sm text-muted">
            Enter the email on your account. Email delivery isn't configured in this deployment yet,
            but the request is validated securely and never reveals whether an account exists.
          </p>
          <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </FormField>
          <Button type="submit" className="w-full" disabled={isSubmitting}>Request reset</Button>
        </form>
      )}
    </AuthShell>
  )
}
