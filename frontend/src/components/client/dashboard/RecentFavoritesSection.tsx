import { Link } from 'react-router-dom'
import { FavoritePropertySummary } from '../../../types/favorite'
import { PropertyPublicResponse, PropertyImage, PropertyType, ListingType, PropertyStatus, Currency } from '../../../types/property'
import { PropertyCard } from '../../PropertyCard'
import { EmptyState } from '../../ui/shared'
import Button from '../../ui/Button'

function mapFavoriteToProperty(favorite: FavoritePropertySummary): PropertyPublicResponse {
  const images: PropertyImage[] = favorite.primary_image_url
    ? [
        {
          id: favorite.id,
          property_id: favorite.id,
          image_url: favorite.primary_image_url,
          alt_text: favorite.title,
          position: 0,
          is_primary: true,
          created_at: '',
          updated_at: '',
        },
      ]
    : []

  return {
    id: favorite.id,
    reference_code: '',
    title: favorite.title,
    description: null,
    property_type: (favorite.property_type as PropertyType) || PropertyType.APARTMENT,
    listing_type: (favorite.listing_type as ListingType) || ListingType.SALE,
    status: (favorite.status as PropertyStatus) || PropertyStatus.AVAILABLE,
    price: favorite.price,
    currency: (favorite.currency as Currency) || Currency.TND,
    area_sqm: favorite.area_sqm || 0,
    land_area_sqm: null,
    rooms: 0,
    bedrooms: favorite.bedrooms || 0,
    bathrooms: favorite.bathrooms || 0,
    floor_number: 0,
    total_floors: 0,
    construction_year: null,
    is_furnished: false,
    is_featured: false,
    address_line: null,
    city: favorite.city,
    district: favorite.district,
    governorate: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    published_at: null,
    created_at: '',
    updated_at: '',
    agent_id: '',
    images,
    features: [],
  }
}

interface RecentFavoritesSectionProps {
  favorites: FavoritePropertySummary[]
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void
}

export function RecentFavoritesSection({ favorites, onFavoriteToggle }: RecentFavoritesSectionProps) {
  return (
    <section aria-labelledby="recent-favorites-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="recent-favorites-heading" className="text-lg font-semibold text-navy-900">Recent Favorites</h2>
        <Link to="/client/favorites" className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded">
          View All
        </Link>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Save properties you like to see them here."
          action={
            <Button as="Link" to="/properties" size="sm">
              Browse Properties
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((favorite) => (
            <PropertyCard
              key={favorite.id}
              property={mapFavoriteToProperty(favorite)}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      )}
    </section>
  )
}
