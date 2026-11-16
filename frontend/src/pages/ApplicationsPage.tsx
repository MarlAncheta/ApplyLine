import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Building2, Columns3, FilePlus2, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/feedback'
import { Pagination } from '@/components/shared/pagination'
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { ApplicationFormDialog } from '@/components/shared/ApplicationFormDialog'
import { ApplicationDetailDialog } from '@/components/shared/ApplicationDetailDialog'
import { applicationsService, type ApplicationQuery } from '@/services/applications.service'
import { companiesService } from '@/services/companies.service'
import { formatDate, titleCase } from '@/lib/utils'
import type { Application } from '@/types'

export default function ApplicationsPage() {
  const [filters, setFilters] = useState<ApplicationQuery>({ page: 1, page_size: 10 })
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['applications', filters],
    queryFn: () => applicationsService.list(filters),
  })
  const companiesQuery = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companiesService.list(undefined, 1, 100),
  })

  function applySearch(value: string) {
    setSearch(value)
    setFilters((f) => ({ ...f, search: value || undefined, page: 1 }))
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Every opportunity you're tracking, all in one place."
        action={
          <>
            <Button asChild variant="outline"><Link to="/app/board"><Columns3 className="h-4 w-4" /> Board view</Link></Button>
            <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add application</Button>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Search by position or notes…"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              aria-label="Search applications"
            />
          </div>
          <select
            className="input-base lg:w-44"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {['interested', 'applied', 'under_review', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn'].map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </select>
          <select
            className="input-base lg:w-40"
            value={filters.priority ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined, page: 1 }))}
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            className="input-base lg:w-44"
            value={`${filters.sort_by ?? 'created_at'}:${filters.sort_order ?? 'desc'}`}
            onChange={(e) => {
              const [sort_by, sort_order] = e.target.value.split(':')
              setFilters((f) => ({ ...f, sort_by, sort_order, page: 1 }))
            }}
            aria-label="Sort applications"
          >
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="position_title:asc">Title A-Z</option>
            <option value="status:asc">Status</option>
            <option value="date_applied:desc">Recently applied</option>
          </select>
        </div>
      </Card>

      {query.isLoading && <TableSkeleton />}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.items.length === 0 && (
        <EmptyState
          icon={<FilePlus2 className="h-6 w-6" />}
          title="No applications yet"
          description={search ? 'No matches. Try a different search or filter.' : 'Add your first opportunity and start tracking your status.'}
          action={!search ? <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add application</Button> : undefined}
        />
      )}

      {query.data && query.data.items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {query.data.items.map((app: Application) => (
              <button
                key={app.id}
                onClick={() => setDetailId(app.id)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-2 sm:px-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{app.position_title}</p>
                  <p className="truncate text-sm text-muted">{app.company?.name ?? 'No company linked'}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <StatusBadge status={app.status} />
                  <PriorityBadge priority={app.priority} />
                </div>
                <div className="hidden w-28 text-right text-xs text-muted md:block">
                  {formatDate(app.date_applied ?? app.created_at)}
                </div>
                <ArrowUpDown className="h-4 w-4 shrink-0 text-muted/50" />
              </button>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Pagination data={query.data} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </div>
        </Card>
      )}

      <ApplicationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        companies={companiesQuery.data?.items ?? []}
      />
      <ApplicationDetailDialog
        applicationId={detailId}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  )
}
