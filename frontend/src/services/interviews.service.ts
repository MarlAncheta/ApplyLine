import { api } from './api'
import type { Interview, Paginated } from '@/types'

export interface InterviewQuery {
  upcoming_only?: boolean
  application_id?: string
  page?: number
  page_size?: number
}

export const interviewsService = {
  async list(query: InterviewQuery = {}): Promise<Paginated<Interview>> {
    const { data } = await api.get<Paginated<Interview>>('/interviews', { params: query })
    return data
  },

  async get(id: string): Promise<Interview> {
    const { data } = await api.get<Interview>(`/interviews/${id}`)
    return data
  },

  async create(payload: Record<string, unknown>): Promise<Interview> {
    const { data } = await api.post<Interview>('/interviews', payload)
    return data
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Interview> {
    const { data } = await api.patch<Interview>(`/interviews/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/interviews/${id}`)
  },
}
