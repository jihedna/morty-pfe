import { useState, useEffect, useCallback } from 'react'
import { propertyApi } from '../lib/propertyApi'
import { FavoriteListResponse } from '../types/favorite'

interface UseFavoritesResult {
  data: FavoriteListResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFavorites(skip: number = 0, limit: number = 20): UseFavoritesResult {
  const [data, setData] = useState<FavoriteListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await propertyApi.listFavorites(skip, limit)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
    } finally {
      setIsLoading(false)
    }
  }, [skip, limit])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return { data, isLoading, error, refetch: fetchFavorites }
}
