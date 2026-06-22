import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProperties } from '../hooks/useProperties'
import { PropertyCard } from '../components/PropertyCard'
import { Pagination } from '../components/Pagination'
import { PropertyListFilters, PropertyType, ListingType } from '../types/property'

export default function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<PropertyListFilters>(() => {
    const initialFilters: PropertyListFilters = {
      skip: 0,
      limit: 20,
      sort_by: 'created_at',
      sort_direction: 'desc',
    }

    // Initialize from URL params
    const search = searchParams.get('search')
    const propertyType = searchParams.get('property_type') as PropertyType | null
    const listingType = searchParams.get('listing_type') as ListingType | null
    const city = searchParams.get('city')
    const minimumPrice = searchParams.get('minimum_price')
    const maximumPrice = searchParams.get('maximum_price')
    const minimumBedrooms = searchParams.get('minimum_bedrooms')
    const minimumBathrooms = searchParams.get('minimum_bathrooms')
    const page = searchParams.get('page')

    if (search) initialFilters.search = search
    if (propertyType) initialFilters.property_type = propertyType
    if (listingType) initialFilters.listing_type = listingType
    if (city) initialFilters.city = city
    if (minimumPrice) initialFilters.minimum_price = Number(minimumPrice)
    if (maximumPrice) initialFilters.maximum_price = Number(maximumPrice)
    if (minimumBedrooms) initialFilters.minimum_bedrooms = Number(minimumBedrooms)
    if (minimumBathrooms) initialFilters.minimum_bathrooms = Number(minimumBathrooms)
    if (page) initialFilters.skip = (Number(page) - 1) * 20

    return initialFilters
  })

  const { data, isLoading, error, refetch } = useProperties(filters)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.property_type) params.set('property_type', filters.property_type)
    if (filters.listing_type) params.set('listing_type', filters.listing_type)
    if (filters.city) params.set('city', filters.city)
    if (filters.minimum_price) params.set('minimum_price', String(filters.minimum_price))
    if (filters.maximum_price) params.set('maximum_price', String(filters.maximum_price))
    if (filters.minimum_bedrooms) params.set('minimum_bedrooms', String(filters.minimum_bedrooms))
    if (filters.minimum_bathrooms) params.set('minimum_bathrooms', String(filters.minimum_bathrooms))
    
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="mt-2 text-gray-600">Find your perfect property</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Search */}
              <div className="mb-4">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Property Type */}
              <div className="mb-4">
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  value={filters.property_type || ''}
                  onChange={(e) => handleFilterChange('property_type', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value={PropertyType.APARTMENT}>Apartment</option>
                  <option value={PropertyType.HOUSE}>House</option>
                  <option value={PropertyType.VILLA}>Villa</option>
                  <option value={PropertyType.LAND}>Land</option>
                  <option value={PropertyType.OFFICE}>Office</option>
                  <option value={PropertyType.COMMERCIAL}>Commercial</option>
                  <option value={PropertyType.STUDIO}>Studio</option>
                  <option value={PropertyType.DUPLEX}>Duplex</option>
                </select>
              </div>

              {/* Listing Type */}
              <div className="mb-4">
                <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Type
                </label>
                <select
                  id="listingType"
                  value={filters.listing_type || ''}
                  onChange={(e) => handleFilterChange('listing_type', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value={ListingType.SALE}>For Sale</option>
                  <option value={ListingType.RENT}>For Rent</option>
                </select>
              </div>

              {/* City */}
              <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                  placeholder="Enter city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range (TND)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minimum_price || ''}
                    onChange={(e) => handleFilterChange('minimum_price', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maximum_price || ''}
                    onChange={(e) => handleFilterChange('maximum_price', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-4">
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Bedrooms
                </label>
                <select
                  id="bedrooms"
                  value={filters.minimum_bedrooms || ''}
                  onChange={(e) => handleFilterChange('minimum_bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* Bathrooms */}
              <div className="mb-4">
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Bathrooms
                </label>
                <select
                  id="bathrooms"
                  value={filters.minimum_bathrooms || ''}
                  onChange={(e) => handleFilterChange('minimum_bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ skip: 0, limit: 20, sort_by: 'created_at', sort_direction: 'desc' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Property Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : data && data.properties.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {data.skip + 1}-{Math.min(data.skip + data.limit, data.total)} of {data.total} properties
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
