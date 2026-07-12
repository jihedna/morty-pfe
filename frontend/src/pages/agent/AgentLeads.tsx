import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import {
  DataTable,
  ErrorState,
  FilterPanel,
  PageHeader,
} from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import {
  AgentLeadFilters,
  agentLeadsApi,
  AgentLeadResponse,
} from '../../lib/agentLeadsApi'
import { extractApiError } from '../../utils/format'

const qualificationOptions = [
  { value: '', label: 'All' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

const sortOptions = [
  { value: 'lead_score', label: 'Lead score' },
  { value: 'match_percentage', label: 'Match %' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'created_at', label: 'Newest' },
]

const directionOptions = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

const urgencyBadge = (urgency: string | null) => {
  const classes = {
    immediate: 'bg-accent-100 text-accent-700 border-accent-200',
    high: 'bg-warning-100 text-warning-700 border-warning-200',
    medium: 'bg-primary-100 text-primary-700 border-primary-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200',
  }[urgency || 'low'] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {urgency || 'low'}
    </span>
  )
}

const qualificationBadge = (level: string) => {
  const classes = {
    hot: 'bg-accent-100 text-accent-700 border-accent-200',
    warm: 'bg-warning-100 text-warning-700 border-warning-200',
    cold: 'bg-primary-100 text-primary-700 border-primary-200',
  }[level] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {level}
    </span>
  )
}

export default function AgentLeads() {
  const [leads, setLeads] = useState<AgentLeadResponse[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AgentLeadFilters>({
    qualification: '',
    city: '',
    order_by: 'lead_score',
    sort: 'desc',
    skip: 0,
    limit: 20,
  })
  const navigate = useNavigate()

  const loadLeads = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: AgentLeadFilters = {
        ...filters,
        qualification: filters.qualification || undefined,
        city: filters.city || undefined,
      }
      const data = await agentLeadsApi.getLeads(params)
      setLeads(data.leads)
      setTotal(data.total)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const hasFilters = Boolean(filters.qualification || filters.city)

  const clearFilters = () => {
    setFilters({
      qualification: '',
      city: '',
      order_by: 'lead_score',
      sort: 'desc',
      skip: 0,
      limit: 20,
    })
  }

  const tableColumns = [
    {
      key: 'summary',
      header: 'Lead',
      render: (lead: AgentLeadResponse) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {lead.summary || `${lead.property_type} in ${lead.preferred_city || 'any location'}`}
          </p>
          <p className="text-xs text-gray-500">
            {lead.preferred_district
              ? `${lead.preferred_city}, ${lead.preferred_district}`
              : lead.preferred_city || 'No location'}
          </p>
        </div>
      ),
    },
    {
      key: 'property',
      header: 'Property',
      render: (lead: AgentLeadResponse) => (
        <div className="text-sm text-gray-900">
          <p className="capitalize">{lead.property_type}</p>
          <p className="text-xs text-gray-500 capitalize">{lead.listing_type}</p>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (lead: AgentLeadResponse) => (
        <span className="text-sm text-gray-900">
          {lead.minimum_budget && lead.maximum_budget
            ? `${lead.minimum_budget.toLocaleString()} - ${lead.maximum_budget.toLocaleString()} TND`
            : lead.minimum_budget
            ? `From ${lead.minimum_budget.toLocaleString()} TND`
            : lead.maximum_budget
            ? `Up to ${lead.maximum_budget.toLocaleString()} TND`
            : 'Not specified'}
        </span>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (lead: AgentLeadResponse) => urgencyBadge(lead.urgency),
    },
    {
      key: 'score',
      header: 'Score',
      render: (lead: AgentLeadResponse) => (
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{lead.lead_score}</span>
          <span className="text-gray-500 ml-1">/ 100</span>
          <span className="ml-2">{qualificationBadge(lead.qualification_level)}</span>
        </div>
      ),
    },
    {
      key: 'match',
      header: 'Match',
      render: (lead: AgentLeadResponse) => (
        <span className="text-sm font-medium text-gray-900">{lead.match_percentage}%</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (lead: AgentLeadResponse) => (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/agent/leads/${lead.request_id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Leads" subtitle="Matched client search requests and scored leads" />

        {error && <ErrorState message={error} onRetry={loadLeads} />}

        <FilterPanel
          title="Filters"
          hasFilters={hasFilters}
          onClear={clearFilters}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              id="qualification-filter"
              value={filters.qualification || ''}
              onChange={(value) => setFilters((f) => ({ ...f, qualification: value, skip: 0 }))}
              label="Qualification"
              options={qualificationOptions}
              className="w-40"
            />
            <Input
              id="city-filter"
              value={filters.city || ''}
              onChange={(value) => setFilters((f) => ({ ...f, city: value, skip: 0 }))}
              label="City"
              placeholder="Filter by city"
              className="w-56"
            />
            <Select
              id="sort-by"
              value={filters.order_by || 'lead_score'}
              onChange={(value) => setFilters((f) => ({ ...f, order_by: value, skip: 0 }))}
              label="Sort by"
              options={sortOptions}
              className="w-44"
            />
            <Select
              id="sort-direction"
              value={filters.sort || 'desc'}
              onChange={(value) => setFilters((f) => ({ ...f, sort: value as 'asc' | 'desc', skip: 0 }))}
              label="Direction"
              options={directionOptions}
              className="w-36"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={leads}
          keyExtractor={(lead) => lead.request_id}
          isLoading={isLoading}
          loadingMessage="Loading leads…"
          emptyTitle="No leads found"
          emptyDescription="No leads match the current filters. Update your profile to see more matches."
        />

        {total > 0 && (
          <p className="text-sm text-gray-500">
            Showing {leads.length} of {total} leads
          </p>
        )}
      </div>
    </AppLayout>
  )
}
