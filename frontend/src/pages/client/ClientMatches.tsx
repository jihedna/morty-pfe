import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, AgentMatchResponse } from '../../lib/clientSearchRequestsApi'

export default function ClientMatches() {
  const [matches, setMatches] = useState<AgentMatchResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMatches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const requests = await clientSearchRequestsApi.getMyRequests(true)
      if (requests.length > 0) {
        const allMatches = await clientSearchRequestsApi.getAgentMatches(requests[0].id)
        setMatches(allMatches)
      } else {
        setMatches([])
      }
    } catch (err) {
      setError('Failed to load agent matches')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agent Matches</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadMatches}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h2>
            <p className="text-gray-600 mb-4">
              Create a search request to find matching agents.
            </p>
            <Link
              to="/client/search-requests"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Search Requests
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match.agent_id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{match.full_name}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {match.match_score}% Match
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Office:</strong> {match.office}</p>
                  <p><strong>Phone:</strong> {match.phone}</p>
                  <p><strong>Experience:</strong> {match.years_experience} years</p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Matched Criteria:</p>
                  <div className="flex flex-wrap gap-1">
                    {match.matched_criteria.property_type && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Property Type</span>
                    )}
                    {match.matched_criteria.territory && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Territory</span>
                    )}
                    {match.matched_criteria.budget && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Budget</span>
                    )}
                    {match.matched_criteria.availability && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Available</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/conversations/new?agent_id=${match.agent_id}`}
                  className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Contact Agent
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
