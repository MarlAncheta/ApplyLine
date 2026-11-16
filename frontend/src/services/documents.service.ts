import { api } from './api'
import type { CareerDocument, Paginated } from '@/types'

export const documentsService = {
  async list(page = 1, pageSize = 50): Promise<Paginated<CareerDocument>> {
    const { data } = await api.get<Paginated<CareerDocument>>('/documents', {
      params: { page, page_size: pageSize },
    })
    return data
  },

  async upload(
    file: File,
    options: { category?: string; description?: string; applicationIds?: string[] } = {},
  ): Promise<CareerDocument> {
    const form = new FormData()
    form.append('file', file)
    if (options.category) form.append('category', options.category)
    if (options.description) form.append('description', options.description)
    if (options.applicationIds?.length) {
      form.append('application_ids', JSON.stringify(options.applicationIds))
    }
    const { data } = await api.post<CareerDocument>('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async update(id: string, payload: Record<string, unknown>): Promise<CareerDocument> {
    const { data } = await api.patch<CareerDocument>(`/documents/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },

  /** Downloads through the authenticated backend endpoint (works for local and S3 storage). */
  async download(id: string, filename: string): Promise<void> {
    const response = await api.get<Blob>(`/documents/${id}/content`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data as unknown as Blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  },
}
