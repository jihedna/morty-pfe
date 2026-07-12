import React from 'react'
import { Currency } from '../types/property'
import { formatCurrency } from '../utils/format'

interface PriceDisplayProps {
  price: number
  currency?: Currency
  listingType?: 'sale' | 'rent'
  className?: string
  showLabel?: boolean
}

export function PriceDisplay({ 
  price, 
  currency = Currency.TND, 
  listingType = 'sale',
  className = '',
  showLabel = false 
}: PriceDisplayProps) {
  const formattedPrice = formatCurrency(price, currency)
  const label = listingType === 'rent' ? '/month' : ''

  return (
    <div className={`flex items-baseline ${className}`}>
      <span className="text-2xl font-bold">
        {formattedPrice}
      </span>
      {showLabel && label && (
        <span className="ml-1 text-sm text-gray-600">{label}</span>
      )}
    </div>
  )
}
