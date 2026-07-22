import { apiClient } from './apiClient'
import { PropertyType, ListingType } from '../types/property'

export interface ClientSearchRequestCreate {
  property_type: PropertyType
  listing_type: ListingType
  minimum_budget?: number
  maximum_budget?: number
  preferred_city?: string
  preferred_district?: string
  minimum_bedrooms?: number
  minimum_bathrooms?: number
  minimum_area_sqm?: number
  notes?: string
}

export interface ClientSearchRequestUpdate {
  property_type?: PropertyType
  listing_type?: ListingType
  minimum_budget?: number
  maximum_budget?: number
  preferred_city?: string
  preferred_district?: string
  minimum_bedrooms?: number
  minimum_bathrooms?: number
  minimum_area_sqm?: number
  notes?: string
  is_active?: boolean
}

export interface ClientSearchRequestResponse {
  id: string
  client_id: string
  property_id?: string | null
  property_type: PropertyType
  listing_type: ListingType
  minimum_budget: number | null
  maximum_budget: number | null
  preferred_city: string | null
  preferred_district: string | null
  minimum_bedrooms: number | null
  minimum_bathrooms: number | null
  minimum_area_sqm: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AgentMatchResponse {
  agent_id: string
  user_id: string
  full_name: string
  office: string
  phone: string
  years_experience: number
  match_score: number
  matched_criteria: {
    property_type: boolean
    territory: boolean
    budget: boolean
    availability: boolean
  }
  unmatched_criteria: {
    property_type: boolean
    territory: boolean
    budget: boolean
    availability: boolean
  }
}

export interface LeadScoreResponse {
  request_id: string
  lead_score: number
  qualification_level: string
  urgency: string
  lead_score_reasons: string[]
}

export interface PropertyLocationOption {
  value: string
  label: string
  city: string
  governorate: string
}

export const clientSearchRequestsApi = {
  async getLocationOptions(): Promise<PropertyLocationOption[]> {
    return apiClient.get<PropertyLocationOption[]>('/properties/location-options')
  },

  async createSearchRequest(data: ClientSearchRequestCreate): Promise<ClientSearchRequestResponse> {
    const response = await apiClient.post<ClientSearchRequestResponse>('/client-requests', data)
    return response
  },

  async createFromProperty(propertyId: string): Promise<ClientSearchRequestResponse> {
    return apiClient.post<ClientSearchRequestResponse>(`/client-requests/from-property/${propertyId}`, {})
  },

  async getMyRequests(isActive?: boolean): Promise<ClientSearchRequestResponse[]> {
    const params = isActive !== undefined ? { is_active: isActive } : undefined
    const response = await apiClient.get<ClientSearchRequestResponse[]>('/client-requests/me', params || {})
    return response
  },

  async getRequest(requestId: string): Promise<ClientSearchRequestResponse> {
    const response = await apiClient.get<ClientSearchRequestResponse>(`/client-requests/${requestId}`)
    return response
  },

  async updateRequest(requestId: string, data: ClientSearchRequestUpdate): Promise<ClientSearchRequestResponse> {
    const response = await apiClient.patch<ClientSearchRequestResponse>(`/client-requests/${requestId}`, data)
    return response
  },

  async deleteRequest(requestId: string): Promise<void> {
    await apiClient.delete(`/client-requests/${requestId}`)
  },

  async getAgentMatches(requestId: string): Promise<AgentMatchResponse[]> {
    const response = await apiClient.get<AgentMatchResponse[]>(`/client-requests/${requestId}/agent-matches`)
    return response
  },

  async getLeadScore(requestId: string): Promise<LeadScoreResponse> {
    const response = await apiClient.get<LeadScoreResponse>(`/client-requests/${requestId}/lead-score`)
    return response
  },
}
