import { useState, useEffect, useCallback, useRef } from 'react'
import { propertyApi } from '../lib/propertyApi'
import { PropertyListFilters, PropertyListResponse } from '../types/property'

interface UsePropertiesResult {
  data: PropertyListResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProperties(filters: PropertyListFilters = {}): UsePropertiesResult {
  const [data, setData] = useState<PropertyListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchProperties = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await propertyApi.listProperties(filters)
      if (requestId === requestIdRef.current) setData(result)
    } catch (err) {
      if (requestId === requestIdRef.current) {
        console.error('[useProperties] fetch failed:', err)
        setError(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'detail' in err ? String((err as {detail: string}).detail) : 'Failed to fetch properties'))
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return { data, isLoading, error, refetch: fetchProperties }
}
