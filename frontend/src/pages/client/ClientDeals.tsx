import { useCallback, useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/shared'
import { clientDealsApi } from '../../lib/clientDealsApi'
import type { ContractResponse, ContractStatus } from '../../lib/adminContractsApi'
import { extractApiError } from '../../utils/format'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending review' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ClientDeals() {
  const [deals, setDeals] = useState<ContractResponse[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await clientDealsApi.listMyDeals(statusFilter as ContractStatus || undefined)
      setDeals(data.contracts)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load your deals')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { void loadDeals() }, [loadDeals])

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <PageHeader title="My Deals" subtitle="Track your property agreements and approval status in one place" />
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Select id="deal-status" label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-full sm:w-52" />
          <p className="text-sm text-slate-500">{deals.length} deal{deals.length === 1 ? '' : 's'}</p>
        </Card>
        {loading ? <LoadingState message="Loading your deals…" /> : error ? <ErrorState message={error} onRetry={loadDeals} /> : deals.length === 0 ? (
          <Card><EmptyState title="No deals found" description="When an agent submits a deal for you, its review status will appear here." /></Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {deals.map((deal) => (
              <Card key={deal.id} className="relative overflow-hidden">
                <div className={`absolute inset-y-0 left-0 w-1 ${deal.status === 'approved' ? 'bg-success-500' : deal.status === 'pending' ? 'bg-warning-500' : 'bg-accent-500'}`} />
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{deal.contract_type} agreement</p><h2 className="mt-1 text-xl font-semibold capitalize text-navy-900">{deal.property_type} in {deal.city}</h2><p className="mt-1 text-sm text-slate-500">{deal.district || deal.city}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${deal.status === 'approved' ? 'bg-success-100 text-success-700' : deal.status === 'pending' ? 'bg-warning-100 text-warning-800' : 'bg-accent-100 text-accent-700'}`}>{deal.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                  <div><p className="text-xs text-slate-500">Agreed amount</p><p className="mt-1 font-semibold text-navy-900">TND {Number(deal.amount).toLocaleString()}</p></div>
                  <div><p className="text-xs text-slate-500">Agreement date</p><p className="mt-1 font-semibold text-navy-900">{new Date(deal.sale_date).toLocaleDateString()}</p></div>
                </div>
                {deal.status === 'approved' && <p className="mt-4 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">Your deal has been approved by the manager.</p>}
                {deal.property_id && (
                  <Button as="Link" to={deal.status === 'approved' ? `/client/deals/${deal.id}/property` : `/properties/${deal.property_id}`} variant="outline" size="sm" className="mt-4">
                    {deal.status === 'approved' ? 'View Property Record' : 'View Property'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
