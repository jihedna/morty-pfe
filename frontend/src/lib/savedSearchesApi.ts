import { apiClient } from './apiClient'
import { PropertyListResponse } from '../types/property'

export interface SavedSearchCreate {
  name: string
  filters: Record<string, unknown>
  notifications_enabled: boolean
}

export interface SavedSearchUpdate {
  name?: string
  filters?: Record<string, unknown>
  notifications_enabled?: boolean
}

export interface SavedSearchResponse {
  id: string
  user_id: string
  name: string
  filters: Record<string, unknown>
  notifications_enabled: boolean
  is_active: boolean
  last_notified_at: string | null
  created_at: string
  updated_at: string
}

export interface SavedSearchListResponse {
  saved_searches: SavedSearchResponse[]
  total: number
  skip: number
  limit: number
}

export const savedSearchesApi = {
  async createSavedSearch(data: SavedSearchCreate): Promise<SavedSearchResponse> {
    const response = await apiClient.post<SavedSearchResponse>('/api/v1/saved-searches', data)
    return response
  },

  async getMySavedSearches(
    skip: number = 0,
    limit: number = 20,
    includeInactive: boolean = false
  ): Promise<SavedSearchListResponse> {
    const params = { skip, limit, include_inactive: includeInactive } as Record<string, string | number | boolean>
    const response = await apiClient.get<SavedSearchListResponse>('/api/v1/saved-searches/me', params)
    return response
  },

  async getSavedSearch(savedSearchId: string): Promise<SavedSearchResponse> {
    const response = await apiClient.get<SavedSearchResponse>(`/api/v1/saved-searches/${savedSearchId}`)
    return response
  },

  async updateSavedSearch(savedSearchId: string, data: SavedSearchUpdate): Promise<SavedSearchResponse> {
    const response = await apiClient.patch<SavedSearchResponse>(`/api/v1/saved-searches/${savedSearchId}`, data)
    return response
  },

  async deleteSavedSearch(savedSearchId: string): Promise<void> {
    await apiClient.delete(`/api/v1/saved-searches/${savedSearchId}`)
  },

  async getSavedSearchResults(savedSearchId: string, skip: number = 0, limit: number = 20): Promise<PropertyListResponse> {
    const params = { skip, limit } as Record<string, string | number | boolean>
    const response = await apiClient.get<PropertyListResponse>(
      `/api/v1/saved-searches/${savedSearchId}/results`,
      params
    )
    return response
  },
}
