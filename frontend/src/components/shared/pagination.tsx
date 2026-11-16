import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Paginated } from '@/types'

export function Pagination({
  data,
  onPageChange,
}: {
  data: Paginated<unknown>
  onPageChange: (page: number) => void
}) {
  if (data.pages <= 1) return null
  const { page, pages, total, items } = data
  const first = total === 0 ? 0 : (page - 1) * data.page_size + 1
  const last = Math.min(page * data.page_size, total)

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
      <p className="text-xs text-muted">
        Showing <span className="text-text">{first}-{last}</span> of{' '}
        <span className="text-text">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="px-2 text-xs text-muted">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages || items.length === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
