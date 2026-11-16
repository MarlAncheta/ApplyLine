import { useCallback } from 'react'
import { useUiStore, type ToastKind } from '@/stores/ui.store'

export function useToast() {
  const toastFn = useUiStore((s) => s.toast)
  const toast = useCallback((message: string, kind?: ToastKind) => toastFn(message, kind), [toastFn])
  return { toast }
}
