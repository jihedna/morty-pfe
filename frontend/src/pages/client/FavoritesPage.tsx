import React, { useState } from 'react'
import { useFavorites } from '../../hooks/useFavorites'
import { useAuth } from '../../contexts/AuthContext'
import { propertyApi } from '../../lib/propertyApi'
import { PropertyCard } from '../../components/PropertyCard'
import { Pagination } from '../../components/Pagination'
import { PropertyPublicResponse, PropertyType, ListingType, PropertyStatus, Currency } from '../../types/property'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 20
  const { data, isLoading, error, refetch } = useFavorites((currentPage - 1) * limit, limit)

  const handleRemoveFavorite = async (propertyId: string) => {
    if (!user || user.role !== 'client') return

    try {
      await propertyApi.removeFavorite(propertyId)
      refetch()
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You must be logged in as a client to view favorites.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-2 text-gray-600">Properties you've saved for later</p>
        </div>

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
        ) : data && data.favorites.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {data.total} favorite{data.total !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.favorites.map((favorite) => {
                const property: PropertyPublicResponse = {
                  id: favorite.property.id,
                  reference_code: '',
                  title: favorite.property.title,
                  description: null,
                  property_type: favorite.property.property_type as PropertyType,
                  listing_type: favorite.property.listing_type as ListingType,
                  status: favorite.property.status as PropertyStatus,
                  price: favorite.property.price,
                  currency: favorite.property.currency as Currency,
                  area_sqm: favorite.property.area_sqm || 0,
                  land_area_sqm: null,
                  rooms: 0,
                  bedrooms: favorite.property.bedrooms || 0,
                  bathrooms: favorite.property.bathrooms || 0,
                  floor_number: 0,
                  total_floors: 0,
                  construction_year: null,
                  is_furnished: false,
                  is_featured: false,
                  address_line: null,
                  city: favorite.property.city,
                  district: favorite.property.district,
                  governorate: null,
                  postal_code: null,
                  latitude: null,
                  longitude: null,
                  published_at: null,
                  created_at: favorite.favorited_at,
                  updated_at: favorite.favorited_at,
                  images: favorite.property.primary_image_url
                    ? [{ id: '', property_id: favorite.property.id, image_url: favorite.property.primary_image_url, alt_text: null, position: 0, is_primary: true, created_at: favorite.favorited_at, updated_at: favorite.favorited_at }]
                    : [],
                  features: [],
                }
                return (
                  <div key={favorite.id} className="relative">
                    <PropertyCard property={property} />
                    <button
                      onClick={() => handleRemoveFavorite(favorite.property_id)}
                      className="absolute top-2 left-2 z-10 p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">Start saving properties you're interested in!</p>
            <button
              onClick={() => window.location.href = '/properties'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
