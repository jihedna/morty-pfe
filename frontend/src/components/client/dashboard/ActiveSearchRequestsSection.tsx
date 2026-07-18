import { Link } from 'react-router-dom'
import { ClientSearchRequestResponse } from '../../../lib/clientSearchRequestsApi'
import { EmptyState } from '../../ui/shared'
import Button from '../../ui/Button'
import { ClientSearchRequestCard } from './ClientSearchRequestCard'

interface ActiveSearchRequestsSectionProps {
  searchRequests: ClientSearchRequestResponse[]
}

export function ActiveSearchRequestsSection({ searchRequests }: ActiveSearchRequestsSectionProps) {
  return (
    <section className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm" aria-labelledby="active-search-requests-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="active-search-requests-heading" className="text-lg font-semibold text-navy-900">Active Search Requests</h2>
        <Link to="/client/search-requests" className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded">
          View All
        </Link>
      </div>

      {searchRequests.length === 0 ? (
        <EmptyState
          title="No active search requests"
          description="Create a search request to help us find properties that match your needs."
          action={
            <Button as="Link" to="/client/search-requests/new" size="sm">
              Create Request
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {searchRequests.map((request) => (
            <ClientSearchRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </section>
  )
}
