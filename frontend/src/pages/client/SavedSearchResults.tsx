import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { savedSearchesApi, SavedSearchResponse } from '../../lib/savedSearchesApi'
import { PropertyPublicResponse } from '../../types/property'
import { PropertyCard } from '../../components/PropertyCard'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'

const PAGE_SIZE = 12

export default function SavedSearchResults() {
  const { savedSearchId } = useParams<{ savedSearchId: string }>()

  const [savedSearch, setSavedSearch] = useState<SavedSearchResponse | null>(null)
  const [properties, setProperties] = useState<PropertyPublicResponse[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSavedSearch = useCallback(async () => {
    if (!savedSearchId) return
    try {
      const data = await savedSearchesApi.getSavedSearch(savedSearchId)
      setSavedSearch(data)
    } catch {
      setError('Failed to load saved search.')
    }
  }, [savedSearchId])

  const loadResults = useCallback(async () => {
    if (!savedSearchId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await savedSearchesApi.getSavedSearchResults(savedSearchId, skip, PAGE_SIZE)
      setProperties(res.properties)
      setTotal(res.total)
    } catch {
      setError('Failed to load results.')
    } finally {
      setIsLoading(false)
    }
  }, [savedSearchId, skip])

  useEffect(() => {
    loadSavedSearch()
  }, [loadSavedSearch])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/client/saved-searches" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <PageHeader
            title={savedSearch ? savedSearch.name : 'Saved Search Results'}
            subtitle={savedSearch ? `${total} matching ${total === 1 ? 'property' : 'properties'}` : undefined}
          />
        </div>

        {savedSearch && Object.keys(savedSearch.filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(savedSearch.filters).map(([k, v]) =>
              v !== undefined && v !== null && v !== '' ? (
                <span key={k} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100 capitalize">
                  {k.replace(/_/g, ' ')}: {String(v)}
                </span>
              ) : null
            )}
          </div>
        )}

        {error && (
          <ErrorState message={error} onRetry={() => { setSkip(0); loadResults() }} />
        )}

        {isLoading ? (
          <LoadingState />
        ) : properties.length === 0 ? (
          <EmptyState
            title="No matching properties"
            description="No properties match your saved search criteria yet."
            action={
              <Button as="Link" to="/properties" size="sm">
                Browse All Properties
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {properties.map(p => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Saved search results pagination" className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} &middot; {total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(s => Math.max(0, s - PAGE_SIZE))}
                    disabled={skip === 0}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      type="button"
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSkip((page - 1) * PAGE_SIZE)}
                      ariaLabel={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className="hidden sm:inline-flex min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(s => s + PAGE_SIZE)}
                    disabled={skip + PAGE_SIZE >= total}
                  >
                    Next
                  </Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
