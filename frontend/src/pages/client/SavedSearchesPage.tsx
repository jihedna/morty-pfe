import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { savedSearchesApi, SavedSearchResponse } from '../../lib/savedSearchesApi'
import { PageHeader, LoadingState, EmptyState, Card, SectionHeader } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function activeBadge(isActive: boolean) {
  const classes = isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearchResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await savedSearchesApi.getMySavedSearches(0, 50, false)
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

  const handleUpdate = async (savedSearchId: string, updates: Parameters<typeof savedSearchesApi.updateSavedSearch>[1]) => {
    setUpdatingId(savedSearchId)
    try {
      await savedSearchesApi.updateSavedSearch(savedSearchId, updates)
      await loadSavedSearches()
    } catch (err) {
      setError('Failed to update saved search')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (savedSearchId: string) => {
    try {
      await savedSearchesApi.deleteSavedSearch(savedSearchId)
      setConfirmDeleteId(null)
      await loadSavedSearches()
    } catch (err) {
      setError('Failed to delete saved search')
    }
  }

  const formatFilters = (filters: SavedSearchResponse['filters']) => {
    return Object.entries(filters || {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => ({
        label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: String(v),
      }))
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Saved Searches"
          subtitle="Get notified when new listings match your criteria."
          action={
            <Button as="Link" to="/client/saved-searches/new" variant="outline">
              Create New Search
            </Button>
          }
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">{error}</div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : savedSearches.length === 0 ? (
          <EmptyState
            title="No Saved Searches"
            description="Save your property searches to get notified about new listings."
            action={
              <Button as="Link" to="/client/saved-searches/new" size="sm">
                Create Saved Search
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedSearches.map((savedSearch) => (
              <Card key={savedSearch.id} className="flex flex-col">
                <SectionHeader title={savedSearch.name} action={activeBadge(savedSearch.is_active)} />

                <div className="flex flex-wrap gap-2 mb-4">
                  {formatFilters(savedSearch.filters).map(({ label, value }) => (
                    <span key={label} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100">
                      {label}: {value}
                    </span>
                  ))}
                  {formatFilters(savedSearch.filters).length === 0 && (
                    <span className="text-xs text-gray-400">No filters saved</span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span>Notifications</span>
                    <span className={`font-medium ${savedSearch.notifications_enabled ? 'text-success-600' : 'text-gray-500'}`}>
                      {savedSearch.notifications_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {savedSearch.last_notified_at && (
                    <div className="flex items-center justify-between">
                      <span>Last notified</span>
                      <span className="text-gray-500">{new Date(savedSearch.last_notified_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button as="Link" to={`/client/saved-searches/${savedSearch.id}/results`} size="sm" className="flex-1">
                    View Results
                  </Button>
                  <Button
                    type="button"
                    variant={savedSearch.notifications_enabled ? 'secondary' : 'outline'}
                    size="sm"
                    disabled={updatingId === savedSearch.id}
                    onClick={() => handleUpdate(savedSearch.id, { notifications_enabled: !savedSearch.notifications_enabled })}
                  >
                    {savedSearch.notifications_enabled ? 'Mute' : 'Notify'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDeleteId(savedSearch.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Saved Search"
        message="Are you sure you want to delete this saved search? You will stop receiving notifications for it."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
        isDestructive
      />
    </AppLayout>
  )
}
