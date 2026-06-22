import { apiClient } from './apiClient'

export interface PropertyAgentCreate {
  title: string
  description?: string
  property_type: string
  listing_type: string
  status: string
  price: number
  currency?: string
  area_sqm: number
  land_area_sqm?: number
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  floor_number?: number
  total_floors?: number
  construction_year?: number
  is_furnished?: boolean
  address_line?: string
  city?: string
  district?: string
  governorate?: string
  postal_code?: string
  latitude?: number
  longitude?: number
}

export interface PropertyAgentUpdate {
  title?: string
  description?: string
  property_type?: string
  listing_type?: string
  status?: string
  price?: number
  currency?: string
  area_sqm?: number
  land_area_sqm?: number
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  floor_number?: number
  total_floors?: number
  construction_year?: number
  is_furnished?: boolean
  address_line?: string
  city?: string
  district?: string
  governorate?: string
  postal_code?: string
  latitude?: number
  longitude?: number
}

export interface PropertyStatusUpdate {
  status: string
}

export interface PropertyResponse {
  id: string
  reference_code: string
  title: string
  description: string | null
  property_type: string
  listing_type: string
  status: string
  price: number
  currency: string
  area_sqm: number
  land_area_sqm: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  floor_number: number
  total_floors: number
  construction_year: number | null
  is_furnished: boolean
  is_featured: boolean
  address_line: string | null
  city: string | null
  district: string | null
  governorate: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  published_at: string | null
  created_at: string
  updated_at: string
  agent_id: string
  images: PropertyImageResponse[]
  features: PropertyFeatureResponse[]
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

export interface PropertyFeatureResponse {
  id: string
  property_id: string
  feature: string
  created_at: string
  updated_at: string
}

export interface PropertyListResponse {
  properties: PropertyResponse[]
  total: number
  skip: number
  limit: number
}

export const agentPropertiesApi = {
  listMyProperties: async (
    statusFilter?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<PropertyResponse[]> => {
    const params: Record<string, string | number> = { skip, limit }
    if (statusFilter) {
      params.status = statusFilter
    }
    const response = await apiClient.get<PropertyResponse[]>('/api/properties/me/listings', params)
    return response
  },

  getMyProperty: async (propertyId: string): Promise<PropertyResponse> => {
    const response = await apiClient.get<PropertyResponse>(`/api/properties/${propertyId}`)
    return response
  },

  createProperty: async (data: PropertyAgentCreate): Promise<PropertyResponse> => {
    const response = await apiClient.post<PropertyResponse>('/api/properties', data)
    return response
  },

  updateProperty: async (propertyId: string, data: PropertyAgentUpdate): Promise<PropertyResponse> => {
    const response = await apiClient.patch<PropertyResponse>(`/api/properties/${propertyId}`, data)
    return response
  },

  updatePropertyStatus: async (propertyId: string, data: PropertyStatusUpdate): Promise<PropertyResponse> => {
    const response = await apiClient.patch<PropertyResponse>(`/api/properties/${propertyId}/status`, data)
    return response
  },

  deleteOrArchiveProperty: async (propertyId: string): Promise<void> => {
    await apiClient.delete(`/api/properties/${propertyId}`)
  },
}
