import { api } from './api'
import type { Paginated, Reminder } from '@/types'

export const remindersService = {
  async list(completed?: boolean, page = 1, pageSize = 100): Promise<Paginated<Reminder>> {
    const { data } = await api.get<Paginated<Reminder>>('/reminders', {
      params: { completed, page, page_size: pageSize },
    })
    return data
  },

  async get(id: string): Promise<Reminder> {
    const { data } = await api.get<Reminder>(`/reminders/${id}`)
    return data
  },

  async create(payload: Record<string, unknown>): Promise<Reminder> {
    const { data } = await api.post<Reminder>('/reminders', payload)
    return data
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Reminder> {
    const { data } = await api.patch<Reminder>(`/reminders/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`)
  },
}
