import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/PropertyCard'
import { Pagination } from '../components/Pagination'
import { PropertyListFilters, PropertyType, ListingType } from '../types/property'
import PublicLayout from '../components/layout/PublicLayout'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ErrorAlert from '../components/ui/ErrorAlert'
import { FilterPanel, EmptyState } from '../components/ui/shared'

export default function PropertyListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<PropertyListFilters>(() => {
    const initialFilters: PropertyListFilters = {
      skip: 0,
      limit: 20,
      sort_by: 'created_at',
      sort_direction: 'desc',
    }

    const search = searchParams.get('search')
    const propertyType = searchParams.get('property_type') as PropertyType | null
    const listingType = searchParams.get('listing_type') as ListingType | null
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const minimumPrice = searchParams.get('minimum_price')
    const maximumPrice = searchParams.get('maximum_price')
    const minimumBedrooms = searchParams.get('minimum_bedrooms')
    const minimumBathrooms = searchParams.get('minimum_bathrooms')
    const isFeatured = searchParams.get('is_featured')
    const page = searchParams.get('page')

    if (search) initialFilters.search = search
    if (propertyType) initialFilters.property_type = propertyType
    if (listingType) initialFilters.listing_type = listingType
    if (city) initialFilters.city = city
    if (district) initialFilters.district = district
    if (minimumPrice) initialFilters.minimum_price = Number(minimumPrice)
    if (maximumPrice) initialFilters.maximum_price = Number(maximumPrice)
    if (minimumBedrooms) initialFilters.minimum_bedrooms = Number(minimumBedrooms)
    if (minimumBathrooms) initialFilters.minimum_bathrooms = Number(minimumBathrooms)
    if (isFeatured === 'true') initialFilters.is_featured = true
    if (page) initialFilters.skip = (Number(page) - 1) * 20

    return initialFilters
  })

  const { data, isLoading, error, refetch } = useProperties(filters)

  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.property_type) params.set('property_type', filters.property_type)
    if (filters.listing_type) params.set('listing_type', filters.listing_type)
    if (filters.city) params.set('city', filters.city)
    if (filters.district) params.set('district', filters.district)
    if (filters.minimum_price) params.set('minimum_price', String(filters.minimum_price))
    if (filters.maximum_price) params.set('maximum_price', String(filters.maximum_price))
    if (filters.minimum_bedrooms) params.set('minimum_bedrooms', String(filters.minimum_bedrooms))
    if (filters.minimum_bathrooms) params.set('minimum_bathrooms', String(filters.minimum_bathrooms))
    if (filters.is_featured) params.set('is_featured', 'true')

    const currentPage = Math.floor(filters.skip / 20) + 1
    if (currentPage > 1) params.set('page', String(currentPage))

    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value, skip: 0 }))
  }, [])

  const handleFilterChange = useCallback((key: keyof PropertyListFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, skip: 0 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, skip: (page - 1) * 20 }))
  }, [])

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0
  const currentPage = Math.floor(filters.skip / 20) + 1

  const hasActiveFilters = !!(
    filters.search || filters.property_type || filters.listing_type ||
    filters.city || filters.district || filters.minimum_price || filters.maximum_price ||
    filters.minimum_bedrooms || filters.minimum_bathrooms || filters.is_featured
  )

  const sortOptions = [
    { value: 'created_at_desc', label: 'Newest first' },
    { value: 'created_at_asc', label: 'Oldest first' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'area_sqm_desc', label: 'Largest first' },
  ]

  const propertyTypeOptions = [
    { value: '', label: 'All Types' },
    { value: PropertyType.APARTMENT, label: 'Apartment' },
    { value: PropertyType.HOUSE, label: 'House' },
    { value: PropertyType.VILLA, label: 'Villa' },
    { value: PropertyType.LAND, label: 'Land' },
    { value: PropertyType.OFFICE, label: 'Office' },
    { value: PropertyType.COMMERCIAL, label: 'Commercial' },
    { value: PropertyType.STUDIO, label: 'Studio' },
    { value: PropertyType.DUPLEX, label: 'Duplex' },
  ]

  const bathroomOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
  ]

  const clearFilters = () => setFilters({ skip: 0, limit: 20, sort_by: 'created_at', sort_direction: 'desc' })

  return (
    <PublicLayout>
      <div className="bg-navy-900 text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          {user && (
            <button
              type="button"
              onClick={() => navigate(user.role === 'agent' ? '/agent/dashboard' : user.role === 'manager' ? '/admin/dashboard' : '/client/dashboard')}
              className="inline-flex items-center gap-2 text-navy-200 hover:text-white text-sm mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          )}
          <h1 className="text-4xl font-bold mb-2">Find Your Property</h1>
          <p className="text-navy-200 text-lg">Browse {data?.total ?? '...'} available listings across Tunisia</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-4">
              <FilterPanel hasFilters={hasActiveFilters} onClear={clearFilters}>
                <Input
                  id="search"
                  label="Search"
                  value={filters.search || ''}
                  onChange={handleSearchChange}
                  placeholder="Keywords..."
                />

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1.5">Listing Type</span>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    {(['', 'sale', 'rent'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={(filters.listing_type ?? '') === val}
                        onClick={() => handleFilterChange('listing_type', val || undefined)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          (filters.listing_type ?? '') === val
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {val === '' ? 'All' : val === 'sale' ? 'Sale' : 'Rent'}
                      </button>
                    ))}
                  </div>
                </div>

                <Select
                  id="propertyType"
                  value={filters.property_type || ''}
                  onChange={(v) => handleFilterChange('property_type', v || undefined)}
                  label="Property Type"
                  options={propertyTypeOptions}
                />

                <Input
                  id="city"
                  label="City"
                  value={filters.city || ''}
                  onChange={(v) => handleFilterChange('city', v || undefined)}
                  placeholder="e.g. Tunis, Sfax..."
                />

                <Input
                  id="district"
                  label="District"
                  value={filters.district || ''}
                  onChange={(v) => handleFilterChange('district', v || undefined)}
                  placeholder="e.g. Lac, Sidi Bou Said..."
                />

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1.5">Price Range (TND)</span>
                  <div className="flex gap-2">
                    <Input
                      id="minPrice"
                      type="number"
                      label="Min"
                      value={filters.minimum_price ? String(filters.minimum_price) : ''}
                      onChange={(v) => handleFilterChange('minimum_price', v ? Number(v) : undefined)}
                      min="0"
                    />
                    <Input
                      id="maxPrice"
                      type="number"
                      label="Max"
                      value={filters.maximum_price ? String(filters.maximum_price) : ''}
                      onChange={(v) => handleFilterChange('maximum_price', v ? Number(v) : undefined)}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1.5">Min. Bedrooms</span>
                  <div className="flex gap-2">
                    {['', '1', '2', '3', '4'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={String(filters.minimum_bedrooms ?? '') === n}
                        onClick={() => handleFilterChange('minimum_bedrooms', n ? Number(n) : undefined)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          String(filters.minimum_bedrooms ?? '') === n
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        {n === '' ? 'Any' : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>

                <Select
                  id="bathrooms"
                  value={filters.minimum_bathrooms ? String(filters.minimum_bathrooms) : ''}
                  onChange={(v) => handleFilterChange('minimum_bathrooms', v ? Number(v) : undefined)}
                  label="Min. Bathrooms"
                  options={bathroomOptions}
                />

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1.5">Featured</span>
                  <Button
                    type="button"
                    variant={filters.is_featured ? 'primary' : 'outline'}
                    size="sm"
                    aria-pressed={!!filters.is_featured}
                    onClick={() => handleFilterChange('is_featured', !filters.is_featured)}
                  >
                    Featured only
                  </Button>
                </div>
              </FilterPanel>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {!isLoading && !error && data && (
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{data.total}</span> {data.total === 1 ? 'property' : 'properties'} found
                  {data.total > 0 && (
                    <span className="text-gray-400"> · showing {data.skip + 1}–{Math.min(data.skip + data.limit, data.total)}</span>
                  )}
                </p>
                <Select
                  id="sort"
                  value={`${filters.sort_by}_${filters.sort_direction}`}
                  onChange={(v) => {
                    const [sort_by, sort_direction] = v.split('_')
                    setFilters(prev => ({ ...prev, sort_by, sort_direction }))
                  }}
                  options={sortOptions}
                  className="w-48"
                />
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="h-52 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="mb-6">
                <ErrorAlert message={error || 'Failed to load properties'} className="mb-4" />
                <Button onClick={() => refetch()} type="button">
                  Try Again
                </Button>
              </div>
            ) : data && data.properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <Card>
                <EmptyState
                  title="No properties found"
                  description="Try adjusting your filters or search terms."
                  action={hasActiveFilters ? (
                    <Button onClick={clearFilters} type="button">
                      Clear Filters
                    </Button>
                  ) : undefined}
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
