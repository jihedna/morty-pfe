import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { savedSearchesApi, SavedSearchResponse } from '../../lib/savedSearchesApi'

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearchResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await savedSearchesApi.getMySavedSearches(0, 20, false)
      setSavedSearches(data.saved_searches)
    } catch (err) {
      setError('Failed to load saved searches')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavedSearches()
  }, [])

  const handleToggleNotifications = async (savedSearchId: string, currentState: boolean) => {
    try {
      await savedSearchesApi.updateSavedSearch(savedSearchId, { notifications_enabled: !currentState })
      loadSavedSearches()
    } catch (err) {
      setError('Failed to update notifications')
    }
  }

  const handleDelete = async (savedSearchId: string) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      try {
        await savedSearchesApi.deleteSavedSearch(savedSearchId)
        loadSavedSearches()
      } catch (err) {
        setError('Failed to delete saved search')
      }
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <Link
            to="/properties"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Search
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
              onClick={loadSavedSearches}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Saved Searches</h2>
            <p className="text-gray-600 mb-4">
              Save your property searches to get notified about new listings.
            </p>
            <Link
              to="/properties"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSearches.map((savedSearch) => (
              <div key={savedSearch.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{savedSearch.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    savedSearch.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {savedSearch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Notifications:</strong>{' '}
                    {savedSearch.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                  {savedSearch.last_notified_at && (
                    <p>
                      <strong>Last notified:</strong>{' '}
                      {new Date(savedSearch.last_notified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/saved-searches/${savedSearch.id}/results`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Results
                  </Link>
                  <button
                    onClick={() => handleToggleNotifications(savedSearch.id, savedSearch.notifications_enabled)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {savedSearch.notifications_enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(savedSearch.id)}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
