import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminPropertiesApi, PropertyResponse } from '../../lib/adminPropertiesApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const propertyTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Land' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
]

const listingTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' },
]

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'archived', label: 'Archived' },
]

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  ...statusOptions,
]

const featuredOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Featured' },
  { value: 'false', label: 'Not Featured' },
]

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
  const [archivePropertyId, setArchivePropertyId] = useState<string | null>(null)
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

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
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

  const handleArchive = async () => {
    if (!archivePropertyId) return
    try {
      await adminPropertiesApi.archiveProperty(archivePropertyId)
      setArchivePropertyId(null)
      loadProperties()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to archive property')
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const tableColumns = [
    {
      key: 'property',
      header: 'Property',
      render: (property: PropertyResponse) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{property.title}</div>
          <div className="text-sm text-gray-500">{property.bedrooms} bed, {property.bathrooms} bath, {property.area_sqm} m²</div>
        </div>
      ),
    },
    { key: 'reference', header: 'Reference', render: (property: PropertyResponse) => <span className="text-sm text-gray-900">{property.reference_code}</span> },
    { key: 'type', header: 'Type', render: (property: PropertyResponse) => <span className="text-sm text-gray-900 capitalize">{property.property_type}</span> },
    { key: 'listing', header: 'Listing', render: (property: PropertyResponse) => <span className="text-sm text-gray-900 capitalize">{property.listing_type}</span> },
    { key: 'price', header: 'Price', render: (property: PropertyResponse) => <span className="text-sm text-gray-900">{property.price.toLocaleString()} TND</span> },
    { key: 'location', header: 'Location', render: (property: PropertyResponse) => <span className="text-sm text-gray-900">{property.city}, {property.district}</span> },
    { key: 'agent', header: 'Agent', render: (property: PropertyResponse) => <span className="text-sm text-gray-500 font-mono text-xs">{property.agent_id.slice(0, 8)}…</span> },
    {
      key: 'status',
      header: 'Status',
      render: (property: PropertyResponse) => (
        <Select
          value={property.status}
          onChange={v => handleStatusChange(property.id, v)}
          options={statusOptions}
          className="w-32"
        />
      ),
    },
    {
      key: 'featured',
      header: 'Featured',
      render: (property: PropertyResponse) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${property.is_featured ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {property.is_featured ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (property: PropertyResponse) => (
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setArchivePropertyId(property.id)}
        >
          Archive
        </Button>
      ),
    },
  ]

  if (isLoading && properties.length === 0) {
    return (
      <AppLayout>
        <LoadingState message='Loading properties…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title='Property Administration'
          subtitle={`${properties.length} properties`}
          action={
            <Button type='button' onClick={() => loadProperties()} size='sm'>
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
              id="search"
              value={filters.search}
              onChange={v => handleFilterChange('search', v)}
              label="Search"
              placeholder="Title or reference code"
            />
            <Select
              id="property-type"
              value={filters.property_type}
              onChange={v => handleFilterChange('property_type', v)}
              label="Property Type"
              options={propertyTypeOptions}
            />
            <Select
              id="listing-type"
              value={filters.listing_type}
              onChange={v => handleFilterChange('listing_type', v)}
              label="Listing Type"
              options={listingTypeOptions}
            />
            <Input
              id="city"
              value={filters.city}
              onChange={v => handleFilterChange('city', v)}
              label="City"
              placeholder="e.g., Tunis"
            />
            <Input
              id="district"
              value={filters.district}
              onChange={v => handleFilterChange('district', v)}
              label="District"
              placeholder="e.g., Lac 2"
            />
            <Select
              id="status"
              value={filters.status}
              onChange={v => handleFilterChange('status', v)}
              label="Status"
              options={statusFilterOptions}
            />
            <Select
              id="is-featured"
              value={filters.is_featured}
              onChange={v => handleFilterChange('is_featured', v)}
              label="Featured"
              options={featuredOptions}
            />
            <Input
              id="agent-id"
              value={filters.agent_id}
              onChange={v => handleFilterChange('agent_id', v)}
              label="Agent ID"
              placeholder="Agent ID"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={properties}
          keyExtractor={(property) => property.id}
          isLoading={isLoading}
          emptyTitle="No properties found"
          emptyDescription="No properties found matching the current filters"
        />
      </div>

      <ConfirmDialog
        isOpen={!!archivePropertyId}
        title="Archive Property"
        message="Are you sure you want to archive this property?"
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onCancel={() => setArchivePropertyId(null)}
        isDestructive
      />
    </AppLayout>
  )
}
