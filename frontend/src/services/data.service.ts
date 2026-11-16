import { api } from './api'
import type { Activity, Analytics, Dashboard, Paginated } from '@/types'

export const dataService = {
  async dashboard(): Promise<Dashboard> {
    const { data } = await api.get<Dashboard>('/dashboard')
    return data
  },

  async analytics(): Promise<Analytics> {
    const { data } = await api.get<Analytics>('/analytics')
    return data
  },

  async activities(page = 1, pageSize = 20): Promise<Paginated<Activity>> {
    const { data } = await api.get<Paginated<Activity>>('/activities', {
      params: { page, page_size: pageSize },
    })
    return data
  },
}
