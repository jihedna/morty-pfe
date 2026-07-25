import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PropertyStatusActions from '../../components/property/PropertyStatusActions'
import { agentPropertiesApi, PropertyResponse } from '../../lib/agentPropertiesApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, ErrorState } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'archived', label: 'Archived' },
]

export default function AgentProperties() {
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)

  const loadProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await agentPropertiesApi.listMyProperties(statusFilter || undefined, skip, limit)
      setProperties(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, skip, limit])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setSkip(0)
  }

  const handlePreviousPage = () => {
    if (skip > 0) {
      setSkip(skip - limit)
    }
  }

  const handleNextPage = () => {
    setSkip(skip + limit)
  }

  const tableColumns = [
    {
      key: 'property',
      header: 'Property',
      render: (property: PropertyResponse) => (
        <div className="flex items-center gap-3">
          {property.images.length > 0 && (
            <img
              src={property.images[0].image_url}
              alt={property.title}
              className="h-10 w-10 rounded-xl object-cover"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{property.title}</div>
            <div className="text-sm text-gray-500">{property.reference_code}</div>
          </div>
        </div>
      ),
    },
    { key: 'price', header: 'Price', render: (property: PropertyResponse) => <span className="text-sm text-gray-900">{property.price.toLocaleString()} {property.currency}</span> },
    { key: 'type', header: 'Type', render: (property: PropertyResponse) => <span className="text-sm text-gray-900 capitalize">{property.property_type}</span> },
    { key: 'location', header: 'Location', render: (property: PropertyResponse) => <span className="text-sm text-gray-900">{[property.city, property.governorate].filter(Boolean).join(', ') || 'N/A'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (property: PropertyResponse) => (
        <PropertyStatusActions
          propertyId={property.id}
          currentStatus={property.status}
          onStatusChange={loadProperties}
        />
      ),
    },
    { key: 'updated', header: 'Updated', render: (property: PropertyResponse) => <span className="text-sm text-gray-500">{new Date(property.updated_at).toLocaleDateString()}</span> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (property: PropertyResponse) => (
        <div className="flex justify-end gap-3">
          <Button as="Link" to={`/agent/properties/${property.id}/edit`} variant="ghost" size="sm">
            Edit
          </Button>
          <Button as="Link" to={`/properties/${property.id}`} variant="ghost" size="sm">
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <PageHeader
          title="My Properties"
          subtitle="Manage your listings and update their status"
          action={
            <Button as="Link" to="/agent/properties/new">
              Add Property
            </Button>
          }
        />

        {error && <ErrorState message={error} onRetry={loadProperties} />}

        <FilterPanel
          title="Filters"
          hasFilters={!!statusFilter}
          onClear={() => handleStatusFilterChange('')}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              options={statusOptions}
              className="w-44"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={properties}
          keyExtractor={(property) => property.id}
          isLoading={isLoading}
          loadingMessage="Loading properties…"
          emptyTitle="No properties found"
          emptyDescription="No properties match the current filter."
          emptyAction={
            <Button as="Link" to="/agent/properties/new" variant="outline">
              Add Property
            </Button>
          }
        />

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={skip === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Showing {skip + 1}-{Math.min(skip + limit, properties.length + skip)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={properties.length < limit}
          >
            Next
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
