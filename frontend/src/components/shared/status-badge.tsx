import { Badge } from '@/components/ui/badge'
import { titleCase } from '@/lib/utils'
import type { BadgeProps } from '@/components/ui/badge'

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  interested: 'secondary',
  applied: 'info',
  under_review: 'warning',
  assessment: 'warning',
  interview: 'info',
  offer: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
}

const PRIORITY_VARIANTS: Record<string, BadgeProps['variant']> = {
  low: 'secondary',
  medium: 'info',
  high: 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'}>{titleCase(status)}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={PRIORITY_VARIANTS[priority] ?? 'secondary'}>{titleCase(priority)}</Badge>
}
