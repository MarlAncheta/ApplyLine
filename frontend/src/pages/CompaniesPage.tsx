import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Mail, MapPin, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/shared/pagination'
import { CompanyFormDialog } from '@/components/shared/CompanyFormDialog'
import { companiesService } from '@/services/companies.service'
import { extractErrorMessage } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { Company } from '@/types'

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState<Company | null>(null)

  const query = useQuery({
    queryKey: ['companies', search, page],
    queryFn: () => companiesService.list(search || undefined, page, 12),
  })

  async function handleDelete() {
    if (!deleting) return
    try {
      await companiesService.remove(deleting.id)
      await queryClient.invalidateQueries()
      toast('Company removed.', 'success')
      setDeleting(null)
    } catch (error) {
      toast(extractErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Your directory of organizations and the people behind them."
        action={<Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> Add company</Button>}
      />

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search companies…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          aria-label="Search companies"
        />
      </div>

      {query.isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.items.length === 0 && (
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No companies yet" description="Add a company to keep its applications and contacts together." action={<Button onClick={() => setFormOpen(true)}>Add company</Button>} />
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.items.map((company) => (
              <Card key={company.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{company.name}</h3>
                      {company.industry && <p className="truncate text-xs text-muted">{company.industry}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(company); setFormOpen(true) }} aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(company)} aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted">
                  {company.location && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> {company.location}</p>}
                  {company.contact_person && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 shrink-0" /> {company.contact_person}</p>}
                  {company.contact_email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {company.contact_email}</p>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Website
                    </a>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <Badge variant="secondary">{company.application_count} {company.application_count === 1 ? 'application' : 'applications'}</Badge>
                  <Link to={`/app/applications`} className="text-xs text-primary hover:underline">View applications</Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-4"><Pagination data={query.data} onPageChange={setPage} /></div>
        </>
      )}

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'company'}?`}
        description="Applications linked to this company will be kept, but will no longer reference it."
        onConfirm={handleDelete}
      />
    </div>
  )
}
