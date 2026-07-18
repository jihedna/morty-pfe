import { forwardRef } from 'react'
import { PropertyPublicResponse } from '../../../types/property'
import { PropertyCard } from '../../PropertyCard'

interface PropertySearchCardProps {
  property: PropertyPublicResponse
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
}

export const PropertySearchCard = forwardRef<HTMLAnchorElement, PropertySearchCardProps>(
  function PropertySearchCard({ property, isHighlighted, onMouseEnter, onMouseLeave, onFocus }, ref) {
    return (
      <PropertyCard
        ref={ref}
        property={property}
        isHighlighted={isHighlighted}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        className="h-full"
        data-property-id={property.id}
      />
    )
  }
)
