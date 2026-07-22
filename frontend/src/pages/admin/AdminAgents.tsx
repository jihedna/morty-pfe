import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAgentsApi, AgentPublicResponse } from '../../lib/adminAgentsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const emptyAgentForm = {
  first_name: '', last_name: '', email: '', password: '', office: '', phone: '',
  years_experience: '0', availability_status: 'available', languages: '',
  minimum_budget: '0', maximum_budget: '0',
  territories: [] as string[], property_types: [] as string[],
}

const legacyTerritoryOptions = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili',
].map(value => ({ value, label: value }))

const propertyTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Land' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
]

const agentPropertyTypeOptions = propertyTypeOptions
  .filter(option => option.value)
  .map(option => ({ value: option.value, label: option.label }))

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<AgentPublicResponse | null>(null)
  const [agentForm, setAgentForm] = useState(emptyAgentForm)
  const [isSaving, setIsSaving] = useState(false)
  const [territorySelection, setTerritorySelection] = useState('')
  const [propertyTypeSelection, setPropertyTypeSelection] = useState('')
  const [territoryOptions, setTerritoryOptions] = useState(legacyTerritoryOptions)
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

  useEffect(() => {
    adminAgentsApi.listLocationOptions()
      .then(setTerritoryOptions)
      .catch(() => setError('Failed to load property locations'))
  }, [])

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

  const handleCreateAgent = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    if (agentForm.territories.length === 0 || agentForm.property_types.length === 0) {
      setError('Select at least one territory and one property type')
      setIsSaving(false)
      return
    }
    try {
      await adminAgentsApi.createAgentWithAccount({
        ...agentForm,
        years_experience: Number(agentForm.years_experience),
        minimum_budget: Number(agentForm.minimum_budget),
        maximum_budget: Number(agentForm.maximum_budget),
      })
      setAgentForm(emptyAgentForm)
      setIsCreateOpen(false)
      await loadAgents()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to create agent')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return
    setIsSaving(true)
    setError(null)
    try {
      await adminAgentsApi.deleteAgent(agentToDelete.id)
      setAgentToDelete(null)
      await loadAgents()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to delete agent')
    } finally {
      setIsSaving(false)
    }
  }

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
    { key: 'actions', header: 'Actions', render: (agent: AgentPublicResponse) => (
      <Button type="button" variant="danger" size="sm" onClick={() => setAgentToDelete(agent)}>Delete</Button>
    ) },
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
          action={<div className="flex gap-2">
            <Button type='button' onClick={() => setIsCreateOpen(true)} size='sm'>Add agent</Button>
            <Button type='button' variant="outline" onClick={() => loadAgents()} size='sm'>Refresh</Button>
          </div>}
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

        <Modal isOpen={isCreateOpen} onClose={() => !isSaving && setIsCreateOpen(false)} title="Add agent" size="lg"
          footer={<><Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>Cancel</Button><Button type="submit" onClick={() => document.getElementById('create-agent-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))} isLoading={isSaving}>Create agent</Button></>}>
          <form id="create-agent-form" onSubmit={handleCreateAgent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="agent-first-name" label="First name" value={agentForm.first_name} onChange={value => setAgentForm(prev => ({ ...prev, first_name: value }))} required />
            <Input id="agent-last-name" label="Last name" value={agentForm.last_name} onChange={value => setAgentForm(prev => ({ ...prev, last_name: value }))} required />
            <Input id="agent-email" type="email" label="Email" value={agentForm.email} onChange={value => setAgentForm(prev => ({ ...prev, email: value }))} required />
            <Input id="agent-password" type="password" label="Temporary password" value={agentForm.password} onChange={value => setAgentForm(prev => ({ ...prev, password: value }))} required />
            <Input id="agent-office" label="Office" value={agentForm.office} onChange={value => setAgentForm(prev => ({ ...prev, office: value }))} required />
            <Input id="agent-phone" label="Phone" value={agentForm.phone} onChange={value => setAgentForm(prev => ({ ...prev, phone: value }))} required />
            <Input id="agent-experience" type="number" min="0" label="Experience (years)" value={agentForm.years_experience} onChange={value => setAgentForm(prev => ({ ...prev, years_experience: value }))} required />
            <Select id="agent-availability" label="Availability" value={agentForm.availability_status} onChange={value => setAgentForm(prev => ({ ...prev, availability_status: value }))} options={availabilityOptions.filter(option => option.value)} />
            <Input id="agent-min-budget" type="number" min="0" label="Minimum budget (TND)" value={agentForm.minimum_budget} onChange={value => setAgentForm(prev => ({ ...prev, minimum_budget: value }))} required />
            <Input id="agent-max-budget" type="number" min="0" label="Maximum budget (TND)" value={agentForm.maximum_budget} onChange={value => setAgentForm(prev => ({ ...prev, maximum_budget: value }))} required />
            <div className="sm:col-span-2"><Input id="agent-languages" label="Languages" placeholder="Arabic, French, English" value={agentForm.languages} onChange={value => setAgentForm(prev => ({ ...prev, languages: value }))} /></div>
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-end gap-2">
                <Select id="agent-territory" label="Property locations" placeholder="Select a property location" value={territorySelection} onChange={setTerritorySelection} options={territoryOptions.filter(option => !agentForm.territories.includes(option.value))} className="flex-1" />
                <Button variant="outline" onClick={() => { if (territorySelection) { setAgentForm(prev => ({ ...prev, territories: [...prev.territories, territorySelection] })); setTerritorySelection('') } }} disabled={!territorySelection}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">{agentForm.territories.map(value => <button key={value} type="button" onClick={() => setAgentForm(prev => ({ ...prev, territories: prev.territories.filter(item => item !== value) }))} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">{value} ×</button>)}</div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-end gap-2">
                <Select id="agent-property-type" label="Property types" placeholder="Select a property type" value={propertyTypeSelection} onChange={setPropertyTypeSelection} options={agentPropertyTypeOptions.filter(option => !agentForm.property_types.includes(option.value))} className="flex-1" />
                <Button variant="outline" onClick={() => { if (propertyTypeSelection) { setAgentForm(prev => ({ ...prev, property_types: [...prev.property_types, propertyTypeSelection] })); setPropertyTypeSelection('') } }} disabled={!propertyTypeSelection}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">{agentForm.property_types.map(value => <button key={value} type="button" onClick={() => setAgentForm(prev => ({ ...prev, property_types: prev.property_types.filter(item => item !== value) }))} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium capitalize text-primary-700">{value} ×</button>)}</div>
            </div>
          </form>
          <p className="mt-4 text-xs text-gray-500">Password must contain uppercase and lowercase letters and a number.</p>
          <p className="mt-2 text-xs text-primary-700">After creation, the ML matcher automatically assigns the 20 best available properties using the selected territories, property types, and budget.</p>
        </Modal>

        <Modal isOpen={Boolean(agentToDelete)} onClose={() => !isSaving && setAgentToDelete(null)} title="Delete agent" size="sm"
          footer={<><Button variant="outline" onClick={() => setAgentToDelete(null)} disabled={isSaving}>Cancel</Button><Button variant="danger" onClick={handleDeleteAgent} isLoading={isSaving}>Delete agent</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{agentToDelete?.user ? `${agentToDelete.user.first_name} ${agentToDelete.user.last_name}` : 'this agent'}</strong>? Their login account, appointments, and conversations will be deleted. Their listings will be reassigned to another agent.</p>
        </Modal>
      </div>
    </AppLayout>
  )
}
