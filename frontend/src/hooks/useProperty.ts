import { useState, useEffect, useCallback } from 'react'
import { propertyApi } from '../lib/propertyApi'
import { PropertyPublicResponse } from '../types/property'

interface UsePropertyResult {
  data: PropertyPublicResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProperty(propertyId: string): UsePropertyResult {
  const [data, setData] = useState<PropertyPublicResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setError('Property ID is required')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await propertyApi.getProperty(propertyId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  return { data, isLoading, error, refetch: fetchProperty }
}
