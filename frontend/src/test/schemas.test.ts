import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, applicationSchema } from '@/schemas'

describe('form validation schemas', () => {
  it('requires an email and password on login', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })

  it('checks registration passwords match', () => {
    const base = { email: 'a@b.com', full_name: 'A B', password: 'Password123!', timezone: 'UTC' }
    expect(registerSchema.safeParse({ ...base, confirm_password: 'different' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...base, confirm_password: 'Password123!' }).success).toBe(true)
  })

  it('requires a position title for applications', () => {
    expect(applicationSchema.safeParse({ position_title: '' }).success).toBe(false)
    expect(applicationSchema.safeParse({ position_title: 'Engineer' }).success).toBe(true)
  })

  it('rejects invalid URLs when provided', () => {
    expect(applicationSchema.safeParse({ position_title: 'Role', job_posting_url: 'not-a-url' }).success).toBe(false)
  })
})
