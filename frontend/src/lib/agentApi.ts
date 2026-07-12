import { apiClient } from './apiClient'

export interface AgentSelfUpdate {
  phone?: string
  biography?: string
  languages?: string
  availability_status?: 'available' | 'busy' | 'unavailable'
}

export interface AgentAvailabilityUpdate {
  availability_status: 'available' | 'busy' | 'unavailable'
}

export interface AgentResponse {
  id: string
  user_id: string
  office: string
  phone: string
  biography: string | null
  years_experience: number
  minimum_budget: number
  maximum_budget: number
  availability_status: string
  active_lead_count: number
  success_rate: number
  closed_deals: number
  languages: string | null
  created_at: string
  updated_at: string
  territories: AgentTerritoryResponse[]
  property_types: AgentPropertyTypeResponse[]
}

export interface AgentTerritoryResponse {
  id: string
  agent_id: string
  territory: string
  expertise_score: number
}

export interface AgentPropertyTypeResponse {
  id: string
  agent_id: string
  property_type: string
  expertise_score: number
}

export const agentApi = {
  getMyProfile: async (): Promise<AgentResponse> => {
    const response = await apiClient.get<AgentResponse>('/agents/me/profile')
    return response
  },

  updateMyProfile: async (data: AgentSelfUpdate): Promise<AgentResponse> => {
    const response = await apiClient.patch<AgentResponse>('/agents/me/profile', data)
    return response
  },

  updateMyAvailability: async (data: AgentAvailabilityUpdate): Promise<AgentResponse> => {
    const response = await apiClient.patch<AgentResponse>('/agents/me/availability', data)
    return response
  },
}
