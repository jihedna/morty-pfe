import { useState } from 'react'
import { useFavorites } from '../../hooks/useFavorites'
import { useAuth } from '../../contexts/AuthContext'
import { propertyApi } from '../../lib/propertyApi'
import { PropertyCard } from '../../components/PropertyCard'
import { Pagination } from '../../components/Pagination'
import AppLayout from '../../components/layout/AppLayout'
import { PropertyPublicResponse, PropertyType, ListingType, PropertyStatus, Currency } from '../../types/property'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'

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
      <AppLayout>
        <EmptyState
          title="Access Denied"
          description="You must be logged in as a client to view favorites."
          action={<Button as="Link" to="/login">Sign In</Button>}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader title="My Favorites" subtitle="Properties you've saved for later" />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.favorites.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {data.total} favorite{data.total !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                  agent_id: '', // Placeholder since favorites API doesn't return agent_id
                  images: favorite.property.primary_image_url
                    ? [{ id: '', property_id: favorite.property.id, image_url: favorite.property.primary_image_url, alt_text: null, position: 0, is_primary: true, created_at: favorite.favorited_at, updated_at: favorite.favorited_at }]
                    : [],
                  features: [],
                }
                return (
                  <div key={favorite.id} className="relative">
                    <PropertyCard property={property} />
                    <Button
                      type="button"
                      onClick={() => handleRemoveFavorite(favorite.property_id)}
                      variant="danger"
                      size="sm"
                      className="absolute top-2 left-2 z-10 !p-2 rounded-full shadow-md"
                      ariaLabel="Remove from favorites"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
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
          <EmptyState
            title="No favorites yet"
            description="Browse properties and save your favorites here."
            action={
              <Button as="Link" to="/properties" size="sm">
                Browse Properties
              </Button>
            }
          />
        )}
      </div>
    </AppLayout>
  )
}
