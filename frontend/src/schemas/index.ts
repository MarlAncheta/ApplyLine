import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(128)
      .regex(/[A-Za-z0-9]/, 'Password must contain letters or digits'),
    confirm_password: z.string(),
    timezone: z.string().default('UTC'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export const applicationSchema = z.object({
  company_id: z.string().optional().or(z.literal('')),
  position_title: z.string().trim().min(1, 'Position title is required').max(200),
  job_description: z.string().optional(),
  job_posting_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  employment_type: z.string().default('full_time'),
  work_arrangement: z.string().default('remote'),
  location: z.string().optional(),
  salary: z.string().optional(),
  date_discovered: z.string().optional().or(z.literal('')),
  date_applied: z.string().optional().or(z.literal('')),
  status: z.string().default('interested'),
  priority: z.string().default('medium'),
  notes: z.string().optional(),
  follow_up_date: z.string().optional().or(z.literal('')),
})

export const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(200),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  location: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export const interviewSchema = z.object({
  application_id: z.string().optional().or(z.literal('')),
  title: z.string().trim().min(1, 'Title is required').max(200),
  interview_date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional().or(z.literal('')),
  timezone: z.string().min(1),
  interview_type: z.string(),
  location: z.string().optional(),
  interviewer: z.string().optional(),
  preparation_notes: z.string().optional(),
  outcome: z.string(),
  feedback: z.string().optional(),
})

export const reminderSchema = z.object({
  application_id: z.string().optional().or(z.literal('')),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  due_at: z.string().min(1, 'Date and time are required'),
  category: z.string(),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  timezone: z.string().min(1),
})

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Use at least 8 characters').max(128),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type InterviewInput = z.infer<typeof interviewSchema>
export type ReminderInput = z.infer<typeof reminderSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
