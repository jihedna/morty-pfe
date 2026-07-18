import { useRef } from 'react'
import { PropertyPublicResponse } from '../../../types/property'
import LoadingState from '../../ui/LoadingState'
import { ErrorState, EmptyState } from '../../ui/shared'
import { PropertySearchCard } from './PropertySearchCard'

interface PropertyResultsListProps {
  properties: PropertyPublicResponse[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  hoveredPropertyId?: string | null
  selectedPropertyId?: string | null
  onPropertyHover?: (propertyId: string | null) => void
  onPropertySelect?: (propertyId: string) => void
  onCardRefRegister?: (propertyId: string, element: HTMLAnchorElement | null) => void
}

export function PropertyResultsList({
  properties,
  isLoading,
  error,
  onRetry,
  hoveredPropertyId = null,
  selectedPropertyId = null,
  onPropertyHover,
  onPropertySelect,
  onCardRefRegister,
}: PropertyResultsListProps) {
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  if (isLoading) {
    return <LoadingState message="Loading properties..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No properties found"
        description="Try adjusting your search or filters to see more results."
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
      {properties.map((property) => {
        const normalizedId = String(property.id)
        const isHighlighted = normalizedId === hoveredPropertyId || normalizedId === selectedPropertyId
        
        return (
          <li key={property.id}>
            <PropertySearchCard
              ref={(el) => {
                cardRefs.current[normalizedId] = el
                if (onCardRefRegister) {
                  onCardRefRegister(normalizedId, el)
                }
              }}
              property={property}
              isHighlighted={isHighlighted}
              onMouseEnter={onPropertyHover ? () => onPropertyHover(normalizedId) : undefined}
              onMouseLeave={onPropertyHover ? () => onPropertyHover(null) : undefined}
              onFocus={onPropertySelect ? () => onPropertySelect(normalizedId) : undefined}
            />
          </li>
        )
      })}
    </ul>
  )
}
