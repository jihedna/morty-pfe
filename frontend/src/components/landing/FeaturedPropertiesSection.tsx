import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { propertyApi } from '../../lib/propertyApi'
import type { PropertyPublicResponse } from '../../types/property'
import { formatCurrency, formatArea } from '../../utils/format'
import LoadingState from '../ui/LoadingState'
import ErrorAlert from '../ui/ErrorAlert'

export default function FeaturedPropertiesSection() {
  const [properties, setProperties] = useState<PropertyPublicResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await propertyApi.listProperties({
          limit: 3,
          sort_by: 'created_at',
          sort_direction: 'desc',
        })
        setProperties(result.properties.slice(0, 3))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties')
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const primary = properties[0]
  const secondary = properties.slice(1, 3)

  return (
    <section className="py-16 md:py-24" aria-label="Featured listings">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2 block">Curated Picks</span>
            <h2 className="text-2xl md:text-4xl font-bold text-navy-900 tracking-tight">Featured Listings</h2>
          </div>
          <Link to="/properties" className="text-sm font-medium text-navy-500 border-b border-navy-300 hover:text-primary-600 transition-colors">
            View all properties
          </Link>
        </div>

        {isLoading && <LoadingState message="Loading featured properties…" />}

        {error && <ErrorAlert message={error} />}

        {!isLoading && !error && properties.length === 0 && (
          <div className="text-center py-16 text-navy-500">
            <p className="text-sm">No properties available yet. Check back soon.</p>
          </div>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {primary && (
              <Link to={`/properties/${primary.id}`} className="md:col-span-8 group block overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm hover:shadow-card-lg transition-all" aria-label={`View ${primary.title}`}>
                <div className="relative h-72 md:h-96 overflow-hidden bg-surface-muted">
                  {primary.images[0] ? (
                    <img src={primary.images[0].image_url} alt={primary.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy-300">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {primary.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-navy-900 mb-1">{primary.title}</h3>
                      <p className="text-sm text-navy-500">{primary.city ? primary.city : 'Tunisia'}</p>
                    </div>
                    <span className="text-lg font-semibold text-primary-600">{formatCurrency(primary.price, primary.currency)}</span>
                  </div>
                  <div className="flex gap-6 border-t border-navy-200 pt-4 text-sm text-navy-500">
                    {primary.bedrooms > 0 && <span>{primary.bedrooms} Beds</span>}
                    {primary.bathrooms > 0 && <span>{primary.bathrooms} Baths</span>}
                    {primary.area_sqm > 0 && <span>{formatArea(primary.area_sqm)} m²</span>}
                  </div>
                </div>
              </Link>
            )}

            {secondary.length > 0 && (
              <div className="md:col-span-4 flex flex-col gap-6">
                {secondary.map(prop => (
                  <Link key={prop.id} to={`/properties/${prop.id}`} className="group block overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm hover:shadow-card-lg transition-all" aria-label={`View ${prop.title}`}>
                    <div className="h-40 md:h-48 overflow-hidden bg-surface-muted">
                      {prop.images[0] ? (
                        <img src={prop.images[0].image_url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-navy-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-base font-semibold text-navy-900 mb-1">{prop.title}</h4>
                      <p className="text-primary-600 font-bold text-sm">{formatCurrency(prop.price, prop.currency)}</p>
                      <div className="flex gap-4 mt-2 text-xs text-navy-500">
                        {prop.bedrooms > 0 && <span>{prop.bedrooms} Beds</span>}
                        {prop.area_sqm > 0 && <span>{formatArea(prop.area_sqm)} m²</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
