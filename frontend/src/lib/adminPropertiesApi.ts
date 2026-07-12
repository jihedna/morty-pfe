import { apiClient } from './apiClient'

export interface PropertyResponse {
  id: string
  reference_code: string
  title: string
  description: string | null
  property_type: string
  listing_type: string
  status: string
  price: number
  area_sqm: number
  land_area_sqm: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  floor_number: number
  total_floors: number
  is_furnished: boolean
  is_featured: boolean
  city: string | null
  district: string | null
  governorate: string | null
  address_line: string | null
  latitude: number | null
  longitude: number | null
  agent_id: string
  created_at: string
  updated_at: string
  images: Array<{
    id: string
    property_id: string
    image_url: string
    is_primary: boolean
    alt_text: string | null
  }>
  features: Array<{
    id: string
    property_id: string
    feature: string
  }>
}

export interface PropertyStatusUpdate {
  status: string
}

export interface PropertyAssignmentUpdate {
  agent_id: string
}

export const adminPropertiesApi = {
  getAllProperties: async (params?: {
    search?: string
    property_type?: string
    listing_type?: string
    city?: string
    district?: string
    governorate?: string
    agent_id?: string
    minimum_price?: number
    maximum_price?: number
    minimum_area?: number
    maximum_area?: number
    minimum_bedrooms?: number
    minimum_bathrooms?: number
    feature?: string
    is_furnished?: boolean
    is_featured?: boolean
    status?: string
    reference_code?: string
    minimum_latitude?: number
    maximum_latitude?: number
    minimum_longitude?: number
    maximum_longitude?: number
    skip?: number
    limit?: number
    sort_by?: string
    sort_direction?: string
  }): Promise<PropertyResponse[]> => {
    const queryParams: Record<string, string | number | boolean> = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 20,
      sort_by: params?.sort_by ?? 'created_at',
      sort_direction: params?.sort_direction ?? 'desc',
    }
    if (params?.search) queryParams.search = params.search
    if (params?.property_type) queryParams.property_type = params.property_type
    if (params?.listing_type) queryParams.listing_type = params.listing_type
    if (params?.city) queryParams.city = params.city
    if (params?.district) queryParams.district = params.district
    if (params?.governorate) queryParams.governorate = params.governorate
    if (params?.agent_id) queryParams.agent_id = params.agent_id
    if (params?.minimum_price !== undefined) queryParams.minimum_price = params.minimum_price
    if (params?.maximum_price !== undefined) queryParams.maximum_price = params.maximum_price
    if (params?.minimum_area !== undefined) queryParams.minimum_area = params.minimum_area
    if (params?.maximum_area !== undefined) queryParams.maximum_area = params.maximum_area
    if (params?.minimum_bedrooms !== undefined) queryParams.minimum_bedrooms = params.minimum_bedrooms
    if (params?.minimum_bathrooms !== undefined) queryParams.minimum_bathrooms = params.minimum_bathrooms
    if (params?.feature) queryParams.feature = params.feature
    if (params?.is_furnished !== undefined) queryParams.is_furnished = params.is_furnished
    if (params?.is_featured !== undefined) queryParams.is_featured = params.is_featured
    if (params?.status) queryParams.status = params.status
    if (params?.reference_code) queryParams.reference_code = params.reference_code
    if (params?.minimum_latitude !== undefined) queryParams.minimum_latitude = params.minimum_latitude
    if (params?.maximum_latitude !== undefined) queryParams.maximum_latitude = params.maximum_latitude
    if (params?.minimum_longitude !== undefined) queryParams.minimum_longitude = params.minimum_longitude
    if (params?.maximum_longitude !== undefined) queryParams.maximum_longitude = params.maximum_longitude

    const response = await apiClient.get<PropertyResponse[]>('/properties/admin/all', queryParams)
    return response
  },

  getProperty: async (propertyId: string): Promise<PropertyResponse> => {
    const response = await apiClient.get<PropertyResponse>(`/properties/${propertyId}`)
    return response
  },

  updatePropertyStatus: async (propertyId: string, statusData: PropertyStatusUpdate): Promise<PropertyResponse> => {
    const response = await apiClient.patch<PropertyResponse>(`/properties/${propertyId}/status`, statusData)
    return response
  },

  reassignProperty: async (propertyId: string, assignmentData: PropertyAssignmentUpdate): Promise<PropertyResponse> => {
    const response = await apiClient.patch<PropertyResponse>(`/properties/${propertyId}/assign-agent`, assignmentData)
    return response
  },

  archiveProperty: async (propertyId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}`)
  },
}
