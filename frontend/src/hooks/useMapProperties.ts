import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { propertyApi } from '../lib/propertyApi'
import { PropertyListFilters, PropertyMapItem } from '../types/property'

interface UseMapPropertiesResult {
  data: PropertyMapItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const EXCLUDED_KEYS = new Set(['skip', 'limit'])

export function useMapProperties(filters: PropertyListFilters = {}): UseMapPropertiesResult {
  const [data, setData] = useState<PropertyMapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  const normalizedFilters = useMemo(() => {
    return Object.fromEntries(
      Object.entries(filters).filter(([key]) => !EXCLUDED_KEYS.has(key))
    ) as PropertyListFilters
  }, [filters])

  const filtersRef = useRef(normalizedFilters)
  filtersRef.current = normalizedFilters

  const queryKey = useMemo(() => JSON.stringify(normalizedFilters), [normalizedFilters])

  useEffect(() => {
    let cancelled = false

    const fetchMapProperties = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await propertyApi.listPropertiesForMap(filtersRef.current)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        console.error('[useMapProperties] fetch failed:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch map properties')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchMapProperties()

    return () => {
      cancelled = true
    }
  }, [queryKey, refetchToken])

  const refetch = useCallback(async () => {
    setRefetchToken((token) => token + 1)
  }, [])

  return { data, isLoading, error, refetch }
}
