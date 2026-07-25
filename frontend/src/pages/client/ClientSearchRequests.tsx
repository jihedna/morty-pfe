import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, ClientSearchRequestResponse, LeadScoreResponse } from '../../lib/clientSearchRequestsApi'
import { DataTable, FilterPanel, ErrorState, PageHeader } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function LeadScoreBadge({ score, level }: { score: number; level: string }) {
  const color =
    score >= 70 ? 'bg-success-100 text-success-700 border-success-200'
    : score >= 45 ? 'bg-warning-100 text-warning-700 border-warning-200'
    : 'bg-accent-100 text-accent-700 border-accent-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {score} · {level}
    </span>
  )
}

function activeBadge(isActive: boolean) {
  const classes = isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

const statusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function ClientSearchRequests() {
  const [requests, setRequests] = useState<ClientSearchRequestResponse[]>([])
  const [scores, setScores] = useState<Record<string, LeadScoreResponse>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null)

  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active'

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await clientSearchRequestsApi.getMyRequests(isActiveParam)
      setRequests(data)
      // Fetch lead scores in parallel, silently ignore individual failures
      const scoreResults = await Promise.allSettled(
        data.map(r => clientSearchRequestsApi.getLeadScore(r.id))
      )
      const scoreMap: Record<string, LeadScoreResponse> = {}
      scoreResults.forEach((res, i) => {
        if (res.status === 'fulfilled') scoreMap[data[i].id] = res.value
      })
      setScores(scoreMap)
    } catch (err) {
      setError('Failed to load search requests')
    } finally {
      setIsLoading(false)
    }
  }, [isActiveParam])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleDeactivate = async (requestId: string) => {
    setDeactivatingId(requestId)
    try {
      await clientSearchRequestsApi.updateRequest(requestId, { is_active: false })
      setConfirmDeactivateId(null)
      loadRequests()
    } catch (err) {
      setError('Failed to deactivate request')
    } finally {
      setDeactivatingId(null)
    }
  }

  const tableColumns = [
    { key: 'propertyType', header: 'Type', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900 capitalize">{request.property_type}</span> },
    { key: 'listingType', header: 'Listing', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900 capitalize">{request.listing_type}</span> },
    { key: 'location', header: 'Location', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900">{request.preferred_city || 'Any'}{request.preferred_district && `, ${request.preferred_district}`}</span> },
    { key: 'budget', header: 'Budget', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900">{request.minimum_budget && request.maximum_budget ? `${request.minimum_budget.toLocaleString()} - ${request.maximum_budget.toLocaleString()} TND` : request.minimum_budget ? `From ${request.minimum_budget.toLocaleString()} TND` : request.maximum_budget ? `Up to ${request.maximum_budget.toLocaleString()} TND` : 'Not specified'}</span> },
    { key: 'rooms', header: 'Rooms', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900">{request.minimum_bedrooms ?? '-'} bd / {request.minimum_bathrooms ?? '-'} ba</span> },
    { key: 'area', header: 'Area', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-900">{request.minimum_area_sqm ? `${request.minimum_area_sqm} m²` : '-'}</span> },
    {
      key: 'leadScore',
      header: 'Lead Score',
      render: (request: ClientSearchRequestResponse) =>
        scores[request.id] ? (
          <LeadScoreBadge score={scores[request.id].lead_score} level={scores[request.id].qualification_level} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    { key: 'created', header: 'Created', render: (request: ClientSearchRequestResponse) => <span className="text-sm text-gray-500">{new Date(request.created_at).toLocaleDateString()}</span> },
    { key: 'status', header: 'Status', render: (request: ClientSearchRequestResponse) => activeBadge(request.is_active) },
    {
      key: 'actions',
      header: 'Actions',
      render: (request: ClientSearchRequestResponse) => (
        <div className="flex gap-2">
          <Button as="Link" to={`/client/search-requests/${request.id}/matches`} variant="outline" size="sm">
            Matches
          </Button>
          {request.is_active && (
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDeactivateId(request.id)} disabled={deactivatingId === request.id}>
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <PageHeader
          title="Search Requests"
          subtitle="Manage your property search requests and view agent matches."
          action={
            <Button as="Link" to="/client/search-requests/new">
              Create Request
            </Button>
          }
        />

        {error ? (
          <ErrorState message={error} onRetry={loadRequests} />
        ) : (
          <>
            <FilterPanel
              title="Filters"
              hasFilters={statusFilter !== 'active'}
              onClear={() => setStatusFilter('active')}
            >
              <div className="flex flex-wrap gap-4 items-end">
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
                  label="Status"
                  options={statusFilterOptions}
                  className="w-40"
                />
              </div>
            </FilterPanel>

            <DataTable
              columns={tableColumns}
              rows={requests}
              keyExtractor={(request) => request.id}
              isLoading={isLoading}
              emptyTitle="No Search Requests"
              emptyDescription="You haven't created any search requests matching the current filters."
              emptyAction={
                <Button as="Link" to="/client/search-requests/new" size="sm">
                  Create Your First Request
                </Button>
              }
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeactivateId}
        title="Deactivate Request"
        message="This search request will no longer be matched with agents. You can reactivate it later if you change your mind."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={() => confirmDeactivateId && handleDeactivate(confirmDeactivateId)}
        onCancel={() => setConfirmDeactivateId(null)}
        isDestructive
      />
    </AppLayout>
  )
}
