import { useState, useEffect, useCallback } from 'react'
import { propertyApi } from '../lib/propertyApi'
import { FavoriteCheckResponse } from '../types/favorite'

interface UseFavoriteStatusResult {
  isFavorited: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFavoriteStatus(propertyId: string): UseFavoriteStatusResult {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavoriteStatus = useCallback(async () => {
    if (!propertyId) {
      setError('Property ID is required')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result: FavoriteCheckResponse = await propertyApi.checkFavorite(propertyId)
      setIsFavorited(result.is_favorited)
    } catch (err) {
      // If user is not authenticated, we'll just treat as not favorited
      setIsFavorited(false)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchFavoriteStatus()
  }, [fetchFavoriteStatus])

  return { isFavorited, isLoading, error, refetch: fetchFavoriteStatus }
}
