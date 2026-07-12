import { apiClient } from './apiClient'
import {
  PropertyListFilters,
  PropertyListResponse,
  PropertyPublicResponse,
} from '../types/property'
import {
  FavoriteListResponse,
  FavoriteCheckResponse,
  FavoriteResponse,
} from '../types/favorite'

export interface ApiError {
  detail: string
  [key: string]: unknown
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    typeof (error as ApiError).detail === 'string'
  )
}

export const propertyApi = {
  async listProperties(filters: PropertyListFilters = {}): Promise<PropertyListResponse> {
    // Remove undefined values to avoid sending empty query parameters
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as Record<string, string | number | boolean>

    const response = await apiClient.get<PropertyListResponse>('/properties', params)
    return response
  },

  async getProperty(propertyId: string): Promise<PropertyPublicResponse> {
    const response = await apiClient.get<PropertyPublicResponse>(`/properties/${propertyId}`)
    return response
  },

  async addFavorite(propertyId: string): Promise<FavoriteResponse> {
    const response = await apiClient.post<FavoriteResponse>(`/favorites/${propertyId}`)
    return response
  },

  async removeFavorite(propertyId: string): Promise<void> {
    await apiClient.delete(`/favorites/${propertyId}`)
  },

  async checkFavorite(propertyId: string): Promise<FavoriteCheckResponse> {
    const response = await apiClient.get<FavoriteCheckResponse>(`/favorites/check/${propertyId}`)
    return response
  },

  async listFavorites(skip: number = 0, limit: number = 20): Promise<FavoriteListResponse> {
    const response = await apiClient.get<FavoriteListResponse>('/favorites/me', {
      skip,
      limit,
    })
    return response
  },
}
