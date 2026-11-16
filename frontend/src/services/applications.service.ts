import { api } from './api'
import type { Application, Paginated } from '@/types'

export interface ApplicationQuery {
  search?: string
  status?: string
  priority?: string
  employment_type?: string
  work_arrangement?: string
  company_id?: string
  archived?: boolean
  sort_by?: string
  sort_order?: string
  page?: number
  page_size?: number
}

export const applicationsService = {
  async list(query: ApplicationQuery = {}): Promise<Paginated<Application>> {
    const { data } = await api.get<Paginated<Application>>('/applications', { params: query })
    return data
  },

  async board(): Promise<Application[]> {
    const { data } = await api.get<Application[]>('/applications/board')
    return data
  },

  async get(id: string): Promise<Application> {
    const { data } = await api.get<Application>(`/applications/${id}`)
    return data
  },

  async create(payload: Record<string, unknown>): Promise<Application> {
    const { data } = await api.post<Application>('/applications', payload)
    return data
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Application> {
    const { data } = await api.patch<Application>(`/applications/${id}`, payload)
    return data
  },

  async changeStatus(id: string, status: string): Promise<Application> {
    const { data } = await api.post<Application>(`/applications/${id}/status`, { status })
    return data
  },

  async setArchived(id: string, archived: boolean): Promise<Application> {
    const { data } = await api.post<Application>(`/applications/${id}/archive`, null, {
      params: { archived },
    })
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/applications/${id}`)
  },
}
