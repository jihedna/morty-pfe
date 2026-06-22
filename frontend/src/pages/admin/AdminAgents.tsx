import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAgentsApi, AgentPublicResponse } from '../../lib/adminAgentsApi'
import { extractApiError } from '../../utils/format'

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

  const handleFilterChange = (field: string, value: string) => {
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading agents...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agent Administration</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
                Territory
              </label>
              <input
                id="territory"
                type="text"
                value={filters.territory}
                onChange={(e) => handleFilterChange('territory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City or governorate"
              />
            </div>
            <div>
              <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                id="property-type"
                value={filters.property_type}
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label htmlFor="availability-status" className="block text-sm font-medium text-gray-700 mb-1">
                Availability Status
              </label>
              <select
                id="availability-status"
                value={filters.availability_status}
                onChange={(e) => handleFilterChange('availability_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <input
                id="language"
                type="text"
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Arabic, French"
              />
            </div>
            <div>
              <label htmlFor="min-experience" className="block text-sm font-medium text-gray-700 mb-1">
                Min Experience (years)
              </label>
              <input
                id="min-experience"
                type="number"
                value={filters.minimum_experience}
                onChange={(e) => handleFilterChange('minimum_experience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="min-budget" className="block text-sm font-medium text-gray-700 mb-1">
                Min Budget (TND)
              </label>
              <input
                id="min-budget"
                type="number"
                value={filters.minimum_budget}
                onChange={(e) => handleFilterChange('minimum_budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="max-budget" className="block text-sm font-medium text-gray-700 mb-1">
                Max Budget (TND)
              </label>
              <input
                id="max-budget"
                type="number"
                value={filters.maximum_budget}
                onChange={(e) => handleFilterChange('maximum_budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Agent List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Territories</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Types</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {agent.user.first_name} {agent.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{agent.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.office}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.years_experience} years</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agent.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        agent.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {agent.availability_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.languages.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.territories.map(t => t.city).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.property_types.map(pt => pt.property_type).join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No agents found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
