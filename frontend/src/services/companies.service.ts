import { api } from './api'
import type { Company, Paginated } from '@/types'

export const companiesService = {
  async list(search?: string, page = 1, pageSize = 50): Promise<Paginated<Company>> {
    const { data } = await api.get<Paginated<Company>>('/companies', {
      params: { search, page, page_size: pageSize },
    })
    return data
  },

  async get(id: string): Promise<Company> {
    const { data } = await api.get<Company>(`/companies/${id}`)
    return data
  },

  async create(payload: Record<string, unknown>): Promise<Company> {
    const { data } = await api.post<Company>('/companies', payload)
    return data
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Company> {
    const { data } = await api.patch<Company>(`/companies/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/companies/${id}`)
  },
}
