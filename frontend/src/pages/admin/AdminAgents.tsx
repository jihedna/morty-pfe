import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAgentsApi, AgentPublicResponse } from '../../lib/adminAgentsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const propertyTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
]

const availabilityOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
]

function availabilityBadge(status: string) {
  const classes =
    status === 'available'
      ? 'bg-success-100 text-success-700 border-success-200'
      : status === 'busy'
      ? 'bg-warning-100 text-warning-700 border-warning-200'
      : 'bg-accent-100 text-accent-700 border-accent-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${classes}`}>
      {status}
    </span>
  )
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<AgentPublicResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    territory: '',
    property_type: '',
    availability_status: '',
    minimum_experience: '',
    language: '',
    minimum_budget: '',
    maximum_budget: '',
  })
  const [skip, setSkip] = useState(0)
  const limit = 50

  const loadAgents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await adminAgentsApi.listAgents({
        territory: filters.territory || undefined,
        property_type: filters.property_type || undefined,
        availability_status: filters.availability_status || undefined,
        minimum_experience: filters.minimum_experience ? parseInt(filters.minimum_experience) : undefined,
        language: filters.language || undefined,
        minimum_budget: filters.minimum_budget ? parseFloat(filters.minimum_budget) : undefined,
        maximum_budget: filters.maximum_budget ? parseFloat(filters.maximum_budget) : undefined,
        skip,
        limit,
      })
      setAgents(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load agents')
    } finally {
      setIsLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setSkip(0)
  }

  const handleResetFilters = () => {
    setFilters({
      territory: '',
      property_type: '',
      availability_status: '',
      minimum_experience: '',
      language: '',
      minimum_budget: '',
      maximum_budget: '',
    })
    setSkip(0)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const tableColumns = [
    {
      key: 'agent',
      header: 'Agent',
      render: (agent: AgentPublicResponse) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {agent.user ? `${agent.user.first_name} ${agent.user.last_name}` : '—'}
          </div>
          <div className="text-sm text-gray-500">{agent.user?.email ?? '—'}</div>
        </div>
      ),
    },
    { key: 'office', header: 'Office', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.office}</span> },
    { key: 'phone', header: 'Phone', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.phone}</span> },
    { key: 'experience', header: 'Experience', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.years_experience} years</span> },
    { key: 'availability', header: 'Availability', render: (agent: AgentPublicResponse) => availabilityBadge(agent.availability_status) },
    { key: 'languages', header: 'Languages', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.languages || '—'}</span> },
    { key: 'territories', header: 'Territories', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.territories.map(t => t.territory).join(', ') || '—'}</span> },
    { key: 'propertyTypes', header: 'Property Types', render: (agent: AgentPublicResponse) => <span className="text-sm text-gray-900">{agent.property_types.map(pt => pt.property_type).join(', ') || '—'}</span> },
  ]

  if (isLoading && agents.length === 0) {
    return (
      <AppLayout>
        <LoadingState message='Loading agents…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title='Agent Administration'
          subtitle={`${agents.length} agents`}
          action={
            <Button type='button' onClick={() => loadAgents()} size='sm'>
              Refresh
            </Button>
          }
        />

        {error && (
          <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-2xl" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <FilterPanel
          title="Filters"
          hasFilters={hasFilters}
          onClear={handleResetFilters}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              id="territory"
              value={filters.territory}
              onChange={v => handleFilterChange('territory', v)}
              label="Territory"
              placeholder="City or governorate"
            />
            <Select
              id="property-type"
              value={filters.property_type}
              onChange={v => handleFilterChange('property_type', v)}
              label="Property Type"
              options={propertyTypeOptions}
            />
            <Select
              id="availability-status"
              value={filters.availability_status}
              onChange={v => handleFilterChange('availability_status', v)}
              label="Availability Status"
              options={availabilityOptions}
            />
            <Input
              id="language"
              value={filters.language}
              onChange={v => handleFilterChange('language', v)}
              label="Language"
              placeholder="e.g., Arabic, French"
            />
            <Input
              id="min-experience"
              type="number"
              value={filters.minimum_experience}
              onChange={v => handleFilterChange('minimum_experience', v)}
              label="Min Experience (years)"
              min="0"
            />
            <Input
              id="min-budget"
              type="number"
              value={filters.minimum_budget}
              onChange={v => handleFilterChange('minimum_budget', v)}
              label="Min Budget (TND)"
              min="0"
              step="0.01"
            />
            <Input
              id="max-budget"
              type="number"
              value={filters.maximum_budget}
              onChange={v => handleFilterChange('maximum_budget', v)}
              label="Max Budget (TND)"
              min="0"
              step="0.01"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={agents}
          keyExtractor={(agent) => agent.id}
          isLoading={isLoading}
          emptyTitle="No agents found"
          emptyDescription="No agents found matching the current filters"
        />
      </div>
    </AppLayout>
  )
}
