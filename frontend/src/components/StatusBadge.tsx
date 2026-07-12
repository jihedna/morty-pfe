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
          return 'bg-success-100 text-success-700 border-success-200'
        case 'reserved':
          return 'bg-warning-100 text-warning-700 border-warning-200'
        case 'sold':
        case 'rented':
          return 'bg-gray-100 text-gray-700 border-gray-200'
        case 'draft':
          return 'bg-primary-100 text-primary-700 border-primary-200'
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200'
      }
    }

    if (type === 'appointment') {
      switch (statusLower) {
        case 'confirmed':
          return 'bg-success-100 text-success-700 border-success-200'
        case 'requested':
        case 'pending':
          return 'bg-warning-100 text-warning-700 border-warning-200'
        case 'completed':
          return 'bg-primary-100 text-primary-700 border-primary-200'
        case 'rescheduled':
          return 'bg-primary-100 text-primary-700 border-primary-200'
        case 'cancelled':
        case 'no_show':
          return 'bg-accent-100 text-accent-700 border-accent-200'
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200'
      }
    }

    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass()} ${className}`}
      role="status"
      aria-label={getLabel()}
    >
      {getLabel()}
    </span>
  )
}
