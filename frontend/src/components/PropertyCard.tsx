import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { PropertyPublicResponse } from '../types/property'
import { useAuth } from '../contexts/AuthContext'
import { useFavoriteStatus } from '../hooks/useFavoriteStatus'
import { propertyApi } from '../lib/propertyApi'
import { formatArea } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import { PriceDisplay } from './PriceDisplay'

export interface PropertyCardProps {
  property: PropertyPublicResponse
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void
  className?: string
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
}

export const PropertyCard = forwardRef<HTMLAnchorElement, PropertyCardProps>(function PropertyCard(
  { property, onFavoriteToggle, className = '', isHighlighted, onMouseEnter, onMouseLeave, onFocus },
  ref
) {
  const { user } = useAuth()
  const { isFavorited, isLoading: isFavoriteLoading, refetch } = useFavoriteStatus(property.id)
  const [isToggling, setIsToggling] = React.useState(false)
  const [imgError, setImgError] = React.useState(false)

  const primaryImage = property.images.find(img => img.is_primary) || property.images[0]
  const imageUrl = primaryImage?.image_url || null

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

  const listingBadgeColor = property.listing_type === 'sale'
    ? 'bg-primary-500 text-white'
    : 'bg-success-500 text-white'

  return (
    <Link
      ref={ref}
      to={`/properties/${property.id}`}
      className={`group block bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden hover:shadow-card-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${isHighlighted ? 'ring-2 ring-primary-500 ring-offset-2' : ''} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
            </svg>
            <span className="text-[10px] font-medium capitalize">{property.property_type}</span>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {property.is_featured && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-warning-500 text-white text-[10px] font-bold rounded-full shadow">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Featured
            </span>
          )}
          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full shadow ${listingBadgeColor}`}>
            {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
          </span>
        </div>

        {/* Favorite button */}
        {user?.role === 'client' && (
          <button
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading || isToggling}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:scale-105 disabled:opacity-50 transition-all"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isToggling ? (
              <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isFavorited ? (
              <svg className="w-3.5 h-3.5 text-accent-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}

      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <h3 className="text-base font-semibold text-navy-900 line-clamp-1 flex-1 group-hover:text-primary-600 transition-colors">{property.title}</h3>
          <StatusBadge status={property.status} type="property" />
        </div>
        
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <PriceDisplay
            price={property.price}
            currency={property.currency}
            listingType={property.listing_type}
            className="text-navy-900 text-lg font-bold"
          />
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded-full capitalize">
            {property.property_type.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <svg className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {property.city && property.district
              ? `${property.district}, ${property.city}`
              : property.city || 'Location not specified'}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-navy-600 pt-2 border-t border-slate-200">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span className="font-medium">{property.bathrooms}</span>
            </div>
          )}
          {property.area_sqm > 0 && (
            <div className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="font-medium">{formatArea(property.area_sqm)}</span>
            </div>
          )}
          {property.is_furnished && (
            <span className="ml-auto text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">Furnished</span>
          )}
        </div>
      </div>
    </Link>
  )
})
