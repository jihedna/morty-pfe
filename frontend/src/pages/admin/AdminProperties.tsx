import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminPropertiesApi, PropertyResponse } from '../../lib/adminPropertiesApi'
import { extractApiError } from '../../utils/format'

export default function AdminProperties() {
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    property_type: '',
    listing_type: '',
    city: '',
    district: '',
    status: '',
    is_featured: '',
    agent_id: '',
  })
  const [skip, setSkip] = useState(0)
  const limit = 20

  const loadProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await adminPropertiesApi.getAllProperties({
        search: filters.search || undefined,
        property_type: filters.property_type || undefined,
        listing_type: filters.listing_type || undefined,
        city: filters.city || undefined,
        district: filters.district || undefined,
        status: filters.status || undefined,
        is_featured: filters.is_featured ? filters.is_featured === 'true' : undefined,
        agent_id: filters.agent_id || undefined,
        skip,
        limit,
      })
      setProperties(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setSkip(0)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      property_type: '',
      listing_type: '',
      city: '',
      district: '',
      status: '',
      is_featured: '',
      agent_id: '',
    })
    setSkip(0)
  }

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      await adminPropertiesApi.updatePropertyStatus(propertyId, { status: newStatus })
      loadProperties()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to update property status')
    }
  }

  const handleFeaturedToggle = async () => {
    try {
      // This would need a dedicated endpoint for toggling featured status
      // For now, we'll show a message
      alert('Featured status toggle requires a dedicated backend endpoint')
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to toggle featured status')
    }
  }

  const handleArchive = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to archive this property?')) {
      return
    }

    try {
      await adminPropertiesApi.archiveProperty(propertyId)
      loadProperties()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to archive property')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading properties...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Property Administration</h1>

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
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Title or reference code"
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
              <label htmlFor="listing-type" className="block text-sm font-medium text-gray-700 mb-1">
                Listing Type
              </label>
              <select
                id="listing-type"
                value={filters.listing_type}
                onChange={(e) => handleFilterChange('listing_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tunis"
              />
            </div>
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                id="district"
                type="text"
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lac 2"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label htmlFor="is-featured" className="block text-sm font-medium text-gray-700 mb-1">
                Featured
              </label>
              <select
                id="is-featured"
                value={filters.is_featured}
                onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
            <div>
              <label htmlFor="agent-id" className="block text-sm font-medium text-gray-700 mb-1">
                Agent ID
              </label>
              <input
                id="agent-id"
                type="text"
                value={filters.agent_id}
                onChange={(e) => handleFilterChange('agent_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agent ID"
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

        {/* Property List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.bedrooms} bed, {property.bathrooms} bath, {property.area} m²</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.reference_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{property.property_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{property.listing_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.price.toLocaleString()} TND</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.city}, {property.district}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.agent.user.first_name} {property.agent.user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={property.status}
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleFeaturedToggle()}
                        className={`px-2 py-1 text-xs rounded ${
                          property.is_featured
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {property.is_featured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleArchive(property.id)}
                        className="text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No properties found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
