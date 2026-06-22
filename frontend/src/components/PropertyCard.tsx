import React from 'react'
import { Link } from 'react-router-dom'
import { PropertyPublicResponse } from '../types/property'
import { useAuth } from '../contexts/AuthContext'
import { useFavoriteStatus } from '../hooks/useFavoriteStatus'
import { propertyApi } from '../lib/propertyApi'
import { formatArea, getListingTypeLabel } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import { PriceDisplay } from './PriceDisplay'

interface PropertyCardProps {
  property: PropertyPublicResponse
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void
  className?: string
}

export function PropertyCard({ property, onFavoriteToggle, className = '' }: PropertyCardProps) {
  const { user } = useAuth()
  const { isFavorited, isLoading: isFavoriteLoading, refetch } = useFavoriteStatus(property.id)
  const [isToggling, setIsToggling] = React.useState(false)

  const primaryImage = property.images.find(img => img.is_primary) || property.images[0]
  const imageUrl = primaryImage?.image_url || '/placeholder-property.jpg'

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || user.role !== 'client' || isToggling) {
      return
    }

    const previousState = isFavorited
    setIsToggling(true)

    try {
      if (previousState) {
        await propertyApi.removeFavorite(property.id)
      } else {
        await propertyApi.addFavorite(property.id)
      }
      onFavoriteToggle?.(property.id, !previousState)
      refetch()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Rollback is handled by refetching the actual state
      refetch()
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Link
      to={`/properties/${property.id}`}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg'
          }}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <StatusBadge status={property.status} type="property" />
          {user?.role === 'client' && (
            <button
              onClick={handleFavoriteToggle}
              disabled={isFavoriteLoading}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavoriteLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isFavorited ? (
                <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {property.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-md">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
        
        <div className="mb-3">
          <PriceDisplay 
            price={property.price} 
            currency={property.currency} 
            listingType={property.listing_type} 
          />
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {property.city && property.district ? `${property.district}, ${property.city}` : property.city || 'Location not specified'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
          <div className="flex items-center gap-4">
            {property.bedrooms > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{property.bedrooms} bed</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span>{property.bathrooms} bath</span>
              </div>
            )}
            {property.area_sqm > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>{formatArea(property.area_sqm)} m²</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">{getListingTypeLabel(property.listing_type)}</span>
          {property.is_furnished && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Furnished</span>
          )}
        </div>
      </div>
    </Link>
  )
}
