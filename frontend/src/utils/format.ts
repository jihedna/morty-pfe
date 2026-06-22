import { PropertyStatus, ListingType, Currency } from '../types/property'
import { AppointmentStatus } from '../types/appointment'

// Currency formatting
export function formatCurrency(amount: number, currency: Currency = Currency.TND): string {
  const locale = currency === Currency.TND ? 'tn-TN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Area formatting
export function formatArea(areaSqM: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(areaSqM)
}

// Date formatting
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

// Date and time formatting
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Time formatting
export function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Relative time formatting (e.g., "2 days ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

// Property status label
export function getPropertyStatusLabel(status: PropertyStatus): string {
  const labels: Record<PropertyStatus, string> = {
    [PropertyStatus.DRAFT]: 'Draft',
    [PropertyStatus.AVAILABLE]: 'Available',
    [PropertyStatus.RESERVED]: 'Reserved',
    [PropertyStatus.SOLD]: 'Sold',
    [PropertyStatus.RENTED]: 'Rented',
    [PropertyStatus.ARCHIVED]: 'Archived',
  }
  return labels[status] || status
}

// Listing type label
export function getListingTypeLabel(listingType: ListingType): string {
  const labels: Record<ListingType, string> = {
    [ListingType.SALE]: 'For Sale',
    [ListingType.RENT]: 'For Rent',
  }
  return labels[listingType] || listingType
}

// Appointment status label
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'Pending',
    [AppointmentStatus.CONFIRMED]: 'Confirmed',
    [AppointmentStatus.COMPLETED]: 'Completed',
    [AppointmentStatus.CANCELLED]: 'Cancelled',
    [AppointmentStatus.NO_SHOW]: 'No Show',
  }
  return labels[status] || status
}

// API error extraction
export function extractApiError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'detail' in error) {
    return String(error.detail)
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

// Normalize FastAPI validation errors
export function normalizeValidationError(error: unknown): Record<string, string[]> {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = error.body as Record<string, string[]> | undefined
    if (body) return body
  }
  return { detail: [extractApiError(error)] }
}
