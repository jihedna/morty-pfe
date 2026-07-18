import { useEffect, useState } from 'react'
import { PropertyPublicResponse, PropertyListResponse } from '../../types/property'
import { propertyApi } from '../../lib/propertyApi'
import { PropertyCard } from '../PropertyCard'
import LoadingState from '../ui/LoadingState'
import ErrorAlert from '../ui/ErrorAlert'

interface SimilarPropertiesSectionProps {
  property: PropertyPublicResponse
}

export function SimilarPropertiesSection({ property }: SimilarPropertiesSectionProps) {
  const [similar, setSimilar] = useState<PropertyListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchSimilar = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params: Record<string, string | number> = {
          skip: 0,
          limit: 5,
          listing_type: property.listing_type,
          property_type: property.property_type,
        }
        if (property.city) params.city = property.city
        else if (property.district) params.city = property.district
        else if (property.governorate) params.city = property.governorate

        const result = await propertyApi.listProperties(params)
        if (!cancelled) {
          const filtered = result.properties.filter(p => p.id !== property.id).slice(0, 4)
          setSimilar({ ...result, properties: filtered })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load similar properties')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchSimilar()
    return () => { cancelled = true }
  }, [property.id, property.listing_type, property.property_type, property.city, property.district, property.governorate])

  if (isLoading) return <div data-testid="similar-properties-loading"><LoadingState message="Loading similar properties..." /></div>
  if (error) return <div data-testid="similar-properties-error"><ErrorAlert message={error} /></div>
  if (!similar || similar.properties.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-navy-900">Similar Properties</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {similar.properties.map(p => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  )
}
