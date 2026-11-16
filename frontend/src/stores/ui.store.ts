import { create } from 'zustand'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface UiState {
  sidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toast: (message: string, kind?: ToastKind) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toast: (message, kind = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }))
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((state) => ({ toasts: [...state.toasts.filter((t) => t.id !== id)] }))
      }, 4200)
    }
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
