import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useProperties } from '../hooks/useProperties'
import { useMapProperties } from '../hooks/useMapProperties'
import { propertyApi } from '../lib/propertyApi'
import { extractApiError } from '../utils/format'
import { PropertyListFilters, PropertyType, ListingType, PropertyFeatureEnum } from '../types/property'
import PublicLayout from '../components/layout/PublicLayout'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { PropertySearchToolbar } from '../components/property/search/PropertySearchToolbar'
import { PropertyFiltersDialog } from '../components/property/search/PropertyFiltersDialog'
import { PropertyResultsHeader } from '../components/property/search/PropertyResultsHeader'
import { PropertyResultsList } from '../components/property/search/PropertyResultsList'
import { PropertyPagination } from '../components/property/search/PropertyPagination'
import { PropertySearchMap } from '../components/property/search/PropertySearchMap'
import ErrorAlert from '../components/ui/ErrorAlert'

const PAGE_SIZE = 20
const DEFAULT_SORT_BY = 'created_at'
const DEFAULT_SORT_DIRECTION = 'desc'

const VALID_SORT_BY = new Set(['created_at', 'price', 'area_sqm', 'title'])
const VALID_SORT_DIRECTION = new Set(['asc', 'desc'])

const normalizePropertyId = (value: string | number) => String(value).trim().toLowerCase()

function positionFilterKey(filters: PropertyListFilters): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'skip' && key !== 'limit'))
  )
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const parsed = Number(value)
  return isNaN(parsed) || parsed < 0 ? undefined : parsed
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function parsePage(value: string | null): number {
  const parsed = parseNumber(value)
  return parsed && parsed > 0 ? parsed : 1
}

function validateSortBy(value: string | null): string | undefined {
  return value && VALID_SORT_BY.has(value) ? value : undefined
}

function validateSortDirection(value: string | null): string | undefined {
  return value && VALID_SORT_DIRECTION.has(value) ? value : undefined
}

function searchParamsToFilters(search: string): PropertyListFilters {
  const params = new URLSearchParams(search)
  const page = parsePage(params.get('page'))
  const filters: PropertyListFilters = {
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sort_by: validateSortBy(params.get('sort_by')) || DEFAULT_SORT_BY,
    sort_direction: validateSortDirection(params.get('sort_direction')) || DEFAULT_SORT_DIRECTION,
  }

  const searchQuery = params.get('search')
  if (searchQuery && searchQuery.trim()) filters.search = searchQuery.trim()

  const propertyType = params.get('property_type')
  if (propertyType && Object.values(PropertyType).includes(propertyType as PropertyType)) {
    filters.property_type = propertyType as PropertyType
  }

  const listingType = params.get('listing_type')
  if (listingType && Object.values(ListingType).includes(listingType as ListingType)) {
    filters.listing_type = listingType as ListingType
  }

  const city = params.get('city')
  if (city && city.trim()) filters.city = city.trim()

  const district = params.get('district')
  if (district && district.trim()) filters.district = district.trim()

  const governorate = params.get('governorate')
  if (governorate && governorate.trim()) filters.governorate = governorate.trim()

  const agentId = params.get('agent_id')
  if (agentId && agentId.trim()) filters.agent_id = agentId.trim()

  const minimumPrice = parseNumber(params.get('minimum_price'))
  if (minimumPrice !== undefined) filters.minimum_price = minimumPrice

  const maximumPrice = parseNumber(params.get('maximum_price'))
  if (maximumPrice !== undefined) filters.maximum_price = maximumPrice

  const minimumArea = parseNumber(params.get('minimum_area'))
  if (minimumArea !== undefined) filters.minimum_area = minimumArea

  const maximumArea = parseNumber(params.get('maximum_area'))
  if (maximumArea !== undefined) filters.maximum_area = maximumArea

  const minimumBedrooms = parseNumber(params.get('minimum_bedrooms'))
  if (minimumBedrooms !== undefined) filters.minimum_bedrooms = minimumBedrooms

  const minimumBathrooms = parseNumber(params.get('minimum_bathrooms'))
  if (minimumBathrooms !== undefined) filters.minimum_bathrooms = minimumBathrooms

  const feature = params.get('feature')
  if (feature && Object.values(PropertyFeatureEnum).includes(feature as PropertyFeatureEnum)) {
    filters.feature = feature as PropertyFeatureEnum
  }

  const isFurnished = parseBoolean(params.get('is_furnished'))
  if (isFurnished !== undefined) filters.is_furnished = isFurnished

  const isFeatured = parseBoolean(params.get('is_featured'))
  if (isFeatured !== undefined) filters.is_featured = isFeatured

  return filters
}

function filtersToSearchParams(filters: PropertyListFilters, currentSearch: string): URLSearchParams {
  const params = new URLSearchParams(currentSearch)
  ;[
    'search', 'property_type', 'listing_type', 'city', 'district', 'governorate',
    'agent_id', 'minimum_price', 'maximum_price', 'minimum_area', 'maximum_area',
    'minimum_bedrooms', 'minimum_bathrooms', 'feature', 'is_furnished', 'is_featured',
    'page', 'sort_by', 'sort_direction',
  ].forEach((key) => params.delete(key))

  if (filters.search) params.set('search', filters.search)
  if (filters.property_type) params.set('property_type', filters.property_type)
  if (filters.listing_type) params.set('listing_type', filters.listing_type)
  if (filters.city) params.set('city', filters.city)
  if (filters.district) params.set('district', filters.district)
  if (filters.governorate) params.set('governorate', filters.governorate)
  if (filters.agent_id) params.set('agent_id', filters.agent_id)
  if (filters.minimum_price !== undefined) params.set('minimum_price', String(filters.minimum_price))
  if (filters.maximum_price !== undefined) params.set('maximum_price', String(filters.maximum_price))
  if (filters.minimum_area !== undefined) params.set('minimum_area', String(filters.minimum_area))
  if (filters.maximum_area !== undefined) params.set('maximum_area', String(filters.maximum_area))
  if (filters.minimum_bedrooms !== undefined) params.set('minimum_bedrooms', String(filters.minimum_bedrooms))
  if (filters.minimum_bathrooms !== undefined) params.set('minimum_bathrooms', String(filters.minimum_bathrooms))
  if (filters.feature) params.set('feature', filters.feature)
  if (filters.is_furnished) params.set('is_furnished', 'true')
  if (filters.is_featured) params.set('is_featured', 'true')
  if (filters.sort_by && filters.sort_by !== DEFAULT_SORT_BY) params.set('sort_by', filters.sort_by)
  if (filters.sort_direction && filters.sort_direction !== DEFAULT_SORT_DIRECTION) params.set('sort_direction', filters.sort_direction)

  const page = Math.floor((filters.skip || 0) / PAGE_SIZE) + 1
  if (page > 1) params.set('page', String(page))

  return params
}

export default function PropertyListPage() {
  const { isAuthenticated, user } = useAuth()
  const [, setSearchParams] = useSearchParams()
  const location = useLocation()

  const [filters, setFilters] = useState<PropertyListFilters>(() => searchParamsToFilters(location.search))
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [pendingSelectedPropertyId, setPendingSelectedPropertyId] = useState<string | null>(null)
  const [pendingDestinationPage, setPendingDestinationPage] = useState<number | null>(null)
  const [markerNavigationStatus, setMarkerNavigationStatus] = useState<'idle' | 'locating' | 'loading-page' | 'scrolling'>('idle')
  const [markerNavigationError, setMarkerNavigationError] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const markerRequestIdRef = useRef(0)
  const positionFiltersRef = useRef(positionFilterKey(filters))

  const previousSearchRef = useRef(location.search)
  const previousFiltersRef = useRef<string>(JSON.stringify(filters))

  const { data, isLoading, error, refetch } = useProperties(filters)
  const { data: mapProperties, isLoading: isMapLoading, error: mapError } = useMapProperties(filters)

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const currentPage = Math.floor((filters.skip || 0) / PAGE_SIZE) + 1

  const properties = useMemo(() => data?.properties ?? [], [data?.properties])
  const loadedPage = data ? Math.floor(data.skip / PAGE_SIZE) + 1 : null

  const clearPendingMarkerNavigation = useCallback((message?: string) => {
    markerRequestIdRef.current += 1
    setPendingSelectedPropertyId(null)
    setPendingDestinationPage(null)
    setMarkerNavigationStatus('idle')
    if (message) setMarkerNavigationError(message)
  }, [])

  const selectAndScroll = useCallback((propertyId: string): boolean => {
    const normalizedId = normalizePropertyId(propertyId)
    const card = cardRefs.current.get(normalizedId)
    if (!card) return false
    setSelectedPropertyId(normalizedId)
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setPendingSelectedPropertyId(null)
    setPendingDestinationPage(null)
    setMarkerNavigationStatus('idle')
    setMarkerNavigationError(null)
    return true
  }, [])

  const registerCardRef = useCallback((propertyId: string, element: HTMLAnchorElement | null) => {
    const normalizedId = normalizePropertyId(propertyId)
    if (element) {
      cardRefs.current.set(normalizedId, element)
      if (
        normalizedId === pendingSelectedPropertyId &&
        pendingDestinationPage !== null &&
        loadedPage === pendingDestinationPage &&
        !isLoading
      ) {
        window.requestAnimationFrame(() => selectAndScroll(normalizedId))
      }
    } else cardRefs.current.delete(normalizedId)
  }, [isLoading, loadedPage, pendingDestinationPage, pendingSelectedPropertyId, selectAndScroll])

  const handleMarkerSelect = useCallback(async (clickedId: string) => {
    const propertyId = normalizePropertyId(clickedId)
    const requestId = ++markerRequestIdRef.current
    setPendingSelectedPropertyId(propertyId)
    setPendingDestinationPage(null)
    setSelectedPropertyId(null)
    setMarkerNavigationError(null)

    if (properties.some((property) => normalizePropertyId(property.id) === propertyId)) {
      setPendingDestinationPage(currentPage)
      setMarkerNavigationStatus('scrolling')
      return
    }

    setMarkerNavigationStatus('locating')
    try {
      const position = await propertyApi.getPropertySearchPosition(propertyId, filters, PAGE_SIZE)
      if (requestId !== markerRequestIdRef.current) return
      if (!position.matched || position.page < 1 || normalizePropertyId(position.property_id) !== propertyId) {
        clearPendingMarkerNavigation('The selected map property is not available in these results.')
        return
      }
      setPendingDestinationPage(position.page)
      setMarkerNavigationStatus('loading-page')
      const params = new URLSearchParams(location.search)
      if (position.page > 1) params.set('page', String(position.page))
      else params.delete('page')
      setSearchParams(params, { replace: true })
    } catch (err) {
      if (requestId === markerRequestIdRef.current) {
        clearPendingMarkerNavigation(extractApiError(err) || 'Unable to locate the selected property.')
      }
    }
  }, [clearPendingMarkerNavigation, currentPage, filters, location.search, properties, setSearchParams])

  // Cancel a pending marker selection only when the actual filters or sorting
  // change. A page transition must preserve the UUID until its page is loaded.
  useEffect(() => {
    const nextKey = positionFilterKey(filters)
    if (nextKey !== positionFiltersRef.current) {
      positionFiltersRef.current = nextKey
      clearPendingMarkerNavigation()
      setSelectedPropertyId(null)
    }
  }, [clearPendingMarkerNavigation, filters])

  useEffect(() => {
    if (!pendingSelectedPropertyId || pendingDestinationPage === null || isLoading) return
    if (loadedPage !== pendingDestinationPage) return

    const exactPropertyExists = properties.some(
      (property) => normalizePropertyId(property.id) === pendingSelectedPropertyId
    )
    if (!exactPropertyExists) {
      clearPendingMarkerNavigation('The server returned a page that does not contain the selected property.')
      return
    }

    setMarkerNavigationStatus('scrolling')
  }, [clearPendingMarkerNavigation, isLoading, loadedPage, pendingDestinationPage, pendingSelectedPropertyId, properties])

  // Clamp out of range page after data loads
  useEffect(() => {
    if (data && data.total > 0 && filters.skip && filters.skip >= data.total) {
      const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
      setFilters((prev) => ({ ...prev, skip: (lastPage - 1) * PAGE_SIZE }))
    }
  }, [data, filters.skip])

  // Sync external URL changes (Back/Forward) into filters
  useEffect(() => {
    if (location.search === previousSearchRef.current) return
    const newFilters = searchParamsToFilters(location.search)
    const newFiltersJson = JSON.stringify(newFilters)
    if (newFiltersJson !== previousFiltersRef.current) {
      setFilters(newFilters)
      previousFiltersRef.current = newFiltersJson
    }
    previousSearchRef.current = location.search
  }, [location.search])

  // Sync filter changes to URL
  useEffect(() => {
    const filtersJson = JSON.stringify(filters)
    if (filtersJson === previousFiltersRef.current) return
    previousFiltersRef.current = filtersJson

    const newParams = filtersToSearchParams(filters, location.search)
    const newParamsString = newParams.toString()
    const currentParamsString = new URLSearchParams(location.search).toString()
    if (newParamsString !== currentParamsString) {
      setSearchParams(newParams, { replace: true })
      previousSearchRef.current = newParamsString ? `?${newParamsString}` : ''
    }
  }, [filters, location.search, setSearchParams])

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined, skip: 0 }))
  }, [])

  const handleFilterChange = useCallback((key: keyof PropertyListFilters, value: string | number | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 } as PropertyListFilters))
  }, [])

  const handleSortChange = useCallback((sortBy: string, sortDirection: string) => {
    setFilters((prev) => ({ ...prev, sort_by: sortBy, sort_direction: sortDirection, skip: 0 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages))
    setFilters((prev) => ({ ...prev, skip: (clamped - 1) * PAGE_SIZE }))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [totalPages])

  const handleMoreFiltersApply = useCallback((newFilters: PropertyListFilters) => {
    setFilters((prev) => ({
      ...newFilters,
      skip: 0,
      limit: PAGE_SIZE,
      sort_by: prev.sort_by,
      sort_direction: prev.sort_direction,
    }))
  }, [])

  const resultTitle = filters.search || filters.city || filters.district || filters.governorate || 'Properties'
  const usesClientPortal = isAuthenticated && user?.role === 'client'
  const Layout = usesClientPortal ? AppLayout : PublicLayout

  return (
    <Layout>
      <div className={usesClientPortal ? 'mx-auto max-w-[1500px] space-y-5' : 'min-h-[calc(100vh-64px)] bg-page'}>
        {usesClientPortal && (
          <section className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-7 text-white shadow-card-lg sm:px-8">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-success-400" /> Updated property marketplace
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Find a place that feels right</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Explore verified properties across Tunisia and save the listings you love.</p>
              </div>
            </div>
          </section>
        )}

        <PropertySearchToolbar
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onOpenMoreFilters={() => setIsFiltersDialogOpen(true)}
        />

        <div className={`grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] ${usesClientPortal ? 'pb-6' : 'bg-page p-4 sm:p-6'}`}>
          <section className="min-w-0">
          <PropertyResultsHeader
            title={resultTitle}
            count={data?.total ?? 0}
            sortBy={filters.sort_by || DEFAULT_SORT_BY}
            sortDirection={filters.sort_direction || DEFAULT_SORT_DIRECTION}
            onSortChange={handleSortChange}
          />

          <PropertyResultsList
            properties={properties}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            hoveredPropertyId={hoveredPropertyId}
            selectedPropertyId={selectedPropertyId}
            onPropertyHover={setHoveredPropertyId}
            onPropertySelect={(id) => setSelectedPropertyId(normalizePropertyId(id))}
            onCardRefRegister={registerCardRef}
          />

          {!isLoading && !error && data && (
            <PropertyPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
          </section>

          <aside className="hidden min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card xl:sticky xl:top-4 xl:block xl:h-[calc(100vh-96px)]">
          {isMapLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading map...</div>
          ) : mapError ? (
            <div className="p-4"><ErrorAlert message={mapError} /></div>
          ) : (
            <PropertySearchMap
              properties={mapProperties}
              hoveredPropertyId={hoveredPropertyId}
              selectedPropertyId={selectedPropertyId}
              onPropertyHover={setHoveredPropertyId}
              onPropertySelect={handleMarkerSelect}
            />
          )}
          </aside>
        </div>
      </div>

      {markerNavigationError && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2">
          <ErrorAlert message={markerNavigationError} />
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {markerNavigationStatus === 'locating' ? 'Locating selected property' : markerNavigationStatus === 'loading-page' ? 'Loading selected property page' : markerNavigationStatus === 'scrolling' ? 'Showing selected property' : ''}
      </span>

      <PropertyFiltersDialog
        isOpen={isFiltersDialogOpen}
        filters={filters}
        onClose={() => setIsFiltersDialogOpen(false)}
        onApply={handleMoreFiltersApply}
      />
    </Layout>
  )
}
