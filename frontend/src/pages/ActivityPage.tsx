import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Archive, BriefcaseBusiness, CalendarDays, FileUp, BellRing, Pencil,
  RefreshCw, type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { Pagination } from '@/components/shared/pagination'
import { dataService } from '@/services/data.service'
import { formatDate, titleCase } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  application_created: BriefcaseBusiness,
  application_updated: Pencil,
  status_changed: RefreshCw,
  application_archived: Archive,
  interview_scheduled: CalendarDays,
  interview_updated: CalendarDays,
  reminder_created: BellRing,
  document_uploaded: FileUp,
}

export default function ActivityPage() {
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ['activities', page], queryFn: () => dataService.activities(page, 20) })

  return (
    <div>
      <PageHeader title="Activity" description="A chronological record of everything you've done." />

      {query.isLoading && <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.items.length === 0 && <EmptyState title="No activity yet" description="Actions you take will show up here automatically." />}

      {query.data && query.data.items.length > 0 && (
        <Card className="p-2">
          <ol className="divide-y divide-border">
            {query.data.items.map((item) => {
              const Icon = ICONS[item.type] ?? RefreshCw
              return (
                <li key={item.id} className="flex items-start gap-4 px-3 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.description && <p className="text-sm text-muted">{item.description}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="secondary">{titleCase(item.type)}</Badge>
                      <span className="text-xs text-muted">{formatDate(item.created_at, true)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="px-3 pb-3"><Pagination data={query.data} onPageChange={setPage} /></div>
        </Card>
      )}
    </div>
  )
}
