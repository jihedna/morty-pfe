import React from 'react'
import { PropertyStatus } from '../types/property'
import { AppointmentStatus } from '../types/appointment'
import { getPropertyStatusLabel, getAppointmentStatusLabel } from '../utils/format'

interface StatusBadgeProps {
  status: PropertyStatus | AppointmentStatus | string
  type?: 'property' | 'appointment' | 'default'
  className?: string
}

export function StatusBadge({ status, type = 'default', className = '' }: StatusBadgeProps) {
  const getLabel = () => {
    if (type === 'property' && Object.values(PropertyStatus).includes(status as PropertyStatus)) {
      return getPropertyStatusLabel(status as PropertyStatus)
    }
    if (type === 'appointment' && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      return getAppointmentStatusLabel(status as AppointmentStatus)
    }
    return status
  }

  const getColorClass = () => {
    const statusLower = status.toLowerCase()
    
    if (type === 'property') {
      switch (statusLower) {
        case 'available':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'reserved':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'sold':
        case 'rented':
          return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'draft':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    if (type === 'appointment') {
      switch (statusLower) {
        case 'confirmed':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'cancelled':
        case 'no_show':
          return 'bg-red-100 text-red-800 border-red-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass()} ${className}`}
      role="status"
      aria-label={`Status: ${getLabel()}`}
    >
      {getLabel()}
    </span>
  )
}
