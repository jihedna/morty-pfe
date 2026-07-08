import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, ClientSearchRequestResponse } from '../../lib/clientSearchRequestsApi'

export default function ClientSearchRequests() {
  const [requests, setRequests] = useState<ClientSearchRequestResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await clientSearchRequestsApi.getMyRequests(true)
      setRequests(data)
    } catch (err) {
      setError('Failed to load search requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleDeactivate = async (requestId: string) => {
    try {
      await clientSearchRequestsApi.updateRequest(requestId, { is_active: false })
      loadRequests()
    } catch (err) {
      setError('Failed to deactivate request')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Search Requests</h1>
          <Link
            to="/client/search-requests/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Request
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadRequests}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Search Requests</h2>
            <p className="text-gray-600 mb-4">You haven't created any search requests yet.</p>
            <Link
              to="/client/search-requests/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listing Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{request.property_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{request.listing_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.minimum_budget && request.maximum_budget
                        ? `${request.minimum_budget} - ${request.maximum_budget}`
                        : request.minimum_budget || request.maximum_budget || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.preferred_city || 'Not specified'}
                      {request.preferred_district && `, ${request.preferred_district}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        request.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        to={`/client/search-requests/${request.id}/matches`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Matches
                      </Link>
                      {request.is_active && (
                        <button
                          onClick={() => handleDeactivate(request.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
