import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismissToast } = useUiStore()

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface-2 px-4 py-3 shadow-card animate-fade-in',
              toast.kind === 'success' && 'border-primary/40',
              toast.kind === 'error' && 'border-danger/40',
              toast.kind === 'info' && 'border-info/40',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                toast.kind === 'success' && 'text-primary',
                toast.kind === 'error' && 'text-danger',
                toast.kind === 'info' && 'text-info',
              )}
            />
            <p className="flex-1 text-sm text-text">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded p-0.5 text-muted hover:text-text"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
