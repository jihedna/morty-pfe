import { useState, useEffect, useCallback } from 'react'
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

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await propertyApi.listProperties(filters)
      setData(result)
    } catch (err) {
      console.error('[useProperties] fetch failed:', err)
      setError(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'detail' in err ? String((err as {detail: string}).detail) : 'Failed to fetch properties'))
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return { data, isLoading, error, refetch: fetchProperties }
}
