import { Link } from 'react-router-dom'
import { ClientSearchRequestResponse } from '../../../lib/clientSearchRequestsApi'
import { formatCurrency, formatRelativeTime, getListingTypeLabel } from '../../../utils/format'
import { StatusBadge } from '../../StatusBadge'
import { PropertyType, ListingType, Currency } from '../../../types/property'

function formatPropertyType(type: PropertyType) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatBudget(min: number | null, max: number | null) {
  if (min && max) {
    return `${formatCurrency(min, Currency.TND)} - ${formatCurrency(max, Currency.TND)}`
  }
  if (min) {
    return `From ${formatCurrency(min, Currency.TND)}`
  }
  if (max) {
    return `Up to ${formatCurrency(max, Currency.TND)}`
  }
  return 'Budget not specified'
}

interface ClientSearchRequestCardProps {
  request: ClientSearchRequestResponse
}

export function ClientSearchRequestCard({ request }: ClientSearchRequestCardProps) {
  const title = request.notes || `${request.minimum_bedrooms ? request.minimum_bedrooms + 'BR ' : ''}${formatPropertyType(request.property_type)} in ${request.preferred_city || 'Tunisia'}`
  const location = [request.preferred_district, request.preferred_city].filter(Boolean).join(' – ')
  const budget = formatBudget(request.minimum_budget, request.maximum_budget)

  return (
    <Link
      to={`/client/search-requests/${request.id}/matches`}
      className="group block p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy-900 truncate">{title}</p>
          <p className="text-sm text-navy-500 truncate">{budget}</p>
          {location && <p className="text-xs text-navy-400 truncate mt-0.5">{location}</p>}
        </div>
        <StatusBadge status={request.is_active ? 'active' : 'inactive'} type="default" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-navy-500">
        <span className="px-2 py-0.5 bg-navy-50 rounded-full capitalize">{getListingTypeLabel(request.listing_type as ListingType)}</span>
        {request.minimum_bedrooms !== null && request.minimum_bedrooms > 0 && (
          <span className="px-2 py-0.5 bg-navy-50 rounded-full">{request.minimum_bedrooms}+ beds</span>
        )}
        <span className="ml-auto text-navy-400">{formatRelativeTime(request.created_at)}</span>
      </div>
    </Link>
  )
}
