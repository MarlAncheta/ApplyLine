export interface User {
  id: string
  email: string
  full_name: string
  timezone: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CompanyBrief {
  id: string
  name: string
  industry?: string | null
  location?: string | null
}

export interface DocumentBrief {
  id: string
  original_filename: string
  category: string
}

export interface Application {
  id: string
  owner_id: string
  company_id: string | null
  position_title: string
  job_description: string | null
  job_posting_url: string | null
  employment_type: string
  work_arrangement: string
  location: string | null
  salary: string | null
  date_discovered: string | null
  date_applied: string | null
  status: string
  priority: string
  notes: string | null
  follow_up_date: string | null
  archived: boolean
  created_at: string
  updated_at: string
  company: CompanyBrief | null
  documents: DocumentBrief[]
}

export interface Company {
  id: string
  name: string
  website: string | null
  industry: string | null
  location: string | null
  contact_person: string | null
  contact_email: string | null
  notes: string | null
  created_at: string
  updated_at: string
  application_count: number
}

export interface Interview {
  id: string
  owner_id: string
  application_id: string | null
  title: string
  interview_date: string
  start_time: string | null
  timezone: string
  interview_type: string
  location: string | null
  interviewer: string | null
  preparation_notes: string | null
  outcome: string
  feedback: string | null
  cancelled: boolean
  created_at: string
  updated_at: string
  application_position: string | null
  company_name: string | null
}

export interface Reminder {
  id: string
  owner_id: string
  application_id: string | null
  title: string
  description: string | null
  due_at: string
  category: string
  completed: boolean
  created_at: string
  updated_at: string
  application_position: string | null
}

export interface CareerDocument {
  id: string
  owner_id: string
  original_filename: string
  content_type: string
  size_bytes: number
  category: string
  description: string | null
  created_at: string
  updated_at: string
  application_ids: string[]
}

export interface Activity {
  id: string
  application_id: string | null
  type: string
  title: string
  description: string | null
  meta: Record<string, unknown>
  created_at: string
}

export interface Dashboard {
  total_applications: number
  active_applications: number
  interviews: number
  offers: number
  rejections: number
  upcoming_deadlines: number
  upcoming_interviews: number
  recent_activity: Activity[]
}

export interface Analytics {
  applications_over_time: { label: string; value: number }[]
  applications_by_status: { status: string; count: number }[]
  interview_conversion: { label: string; value: number; rate: number | null }
  offer_conversion: { label: string; value: number; rate: number | null }
  rejection_rate: { label: string; value: number; rate: number | null }
  average_response_days: number | null
  total_applications: number
  insufficient_data: boolean
}

export const APPLICATION_STATUSES = [
  'interested',
  'applied',
  'under_review',
  'assessment',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const

export const EMPLOYMENT_TYPES = [
  'internship',
  'full_time',
  'part_time',
  'contract',
  'freelance',
] as const

export const WORK_ARRANGEMENTS = ['on_site', 'remote', 'hybrid'] as const
export const PRIORITIES = ['low', 'medium', 'high'] as const
export const INTERVIEW_TYPES = ['phone', 'video', 'in_person', 'technical', 'assessment'] as const
export const DOCUMENT_CATEGORIES = ['resume', 'cover_letter', 'certificate', 'portfolio', 'other'] as const
export const REMINDER_CATEGORIES = ['follow_up', 'interview_prep', 'deadline', 'other'] as const
