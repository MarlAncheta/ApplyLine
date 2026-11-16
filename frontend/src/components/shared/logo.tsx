import { cn } from '@/lib/utils'

export function Logo({
  size = 32,
  showWordmark = true,
  wordmarkClassName,
  className,
}: {
  size?: number
  showWordmark?: boolean
  wordmarkClassName?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/icon.png"
        alt={showWordmark ? '' : 'ApplyLine'}
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      {showWordmark && (
        <span className={cn('text-lg font-bold tracking-tight', wordmarkClassName)}>
          ApplyLine
        </span>
      )}
    </span>
  )
}
