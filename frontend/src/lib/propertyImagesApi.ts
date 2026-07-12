import { apiClient } from './apiClient'

export interface PropertyImageCreate {
  image_url: string
  alt_text?: string
  position?: number
  is_primary?: boolean
}

export interface PropertyImageUpdate {
  alt_text?: string
  position?: number
  is_primary?: boolean
}

export interface PropertyImageResponse {
  id: string
  property_id: string
  image_url: string
  alt_text: string | null
  position: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export const propertyImagesApi = {
  addPropertyImage: async (propertyId: string, data: PropertyImageCreate): Promise<PropertyImageResponse> => {
    const response = await apiClient.post<PropertyImageResponse>(`/properties/${propertyId}/images`, data)
    return response
  },

  updatePropertyImage: async (propertyId: string, imageId: string, data: PropertyImageUpdate): Promise<PropertyImageResponse> => {
    const response = await apiClient.patch<PropertyImageResponse>(`/properties/${propertyId}/images/${imageId}`, data)
    return response
  },

  setPrimaryImage: async (propertyId: string, imageId: string): Promise<PropertyImageResponse> => {
    const response = await apiClient.patch<PropertyImageResponse>(`/properties/${propertyId}/images/${imageId}`, { is_primary: true })
    return response
  },

  deletePropertyImage: async (propertyId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/images/${imageId}`)
  },
}
