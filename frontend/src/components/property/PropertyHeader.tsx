import { PropertyPublicResponse } from '../../types/property'
import { getListingTypeLabel, formatCurrency } from '../../utils/format'
import { StatusBadge } from '../StatusBadge'
import { PriceDisplay } from '../PriceDisplay'

interface PropertyHeaderProps {
  property: PropertyPublicResponse
  isFavorited: boolean
  favoriteLoading: boolean
  onFavoriteToggle: () => void
  onShare: () => void
}

export function PropertyHeader({
  property,
  isFavorited,
  favoriteLoading,
  onFavoriteToggle,
  onShare,
}: PropertyHeaderProps) {
  const pricePerSqm = property.area_sqm && property.area_sqm > 0
    ? Math.round(property.price / property.area_sqm)
    : null

  const locationParts = [
    property.address_line,
    property.district,
    property.city,
    property.governorate,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={property.status} type="property" className="text-sm" />
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-100 text-navy-700">
              {getListingTypeLabel(property.listing_type)}
            </span>
            {property.is_featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-navy-900 leading-tight">
            {property.title}
          </h1>
          {locationParts.length > 0 && (
            <p className="text-navy-500 flex items-start gap-1.5 text-sm sm:text-base">
              <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{locationParts.join(', ')}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="p-2.5 rounded-xl border border-slate-200 text-navy-600 hover:bg-surface-muted hover:text-primary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Share property"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onFavoriteToggle}
            disabled={favoriteLoading}
            className={`p-2.5 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              isFavorited
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'border-slate-200 text-navy-600 hover:bg-surface-muted hover:text-red-500'
            }`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorited}
          >
            <svg
              className={`w-5 h-5 ${favoriteLoading ? 'animate-spin' : ''}`}
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <PriceDisplay price={property.price} currency={property.currency} listingType={property.listing_type} />
        {pricePerSqm && (
          <span className="text-navy-500 text-sm">
            ({formatCurrency(pricePerSqm, property.currency)}/m²)
          </span>
        )}
      </div>

      {property.reference_code && (
        <p className="text-xs text-navy-400">Ref: {property.reference_code}</p>
      )}
    </div>
  )
}
