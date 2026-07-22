import { apiClient } from './apiClient'

export interface AgentPublicResponse {
  id: string
  office: string
  phone: string
  biography: string | null
  years_experience: number
  availability_status: string
  languages: string | null
  minimum_budget: number
  maximum_budget: number
  active_lead_count: number
  success_rate: number
  closed_deals: number
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  territories: Array<{
    id: string
    agent_id: string
    territory: string
    expertise_score: number
  }>
  property_types: Array<{
    id: string
    agent_id: string
    property_type: string
    expertise_score: number
  }>
}

export interface AgentCreate {
  user_id: string
  office: string
  phone: string
  years_experience: number
  availability_status: string
  languages: string[]
  minimum_budget: number | null
  maximum_budget: number | null
}

export interface AgentAccountCreate {
  first_name: string
  last_name: string
  email: string
  password: string
  office: string
  phone: string
  biography?: string
  years_experience: number
  availability_status: string
  languages?: string
  minimum_budget: number
  maximum_budget: number
  territories: string[]
  property_types: string[]
}

export interface AgentUpdate {
  user_id?: string
  office?: string
  phone?: string
  years_experience?: number
  availability_status?: string
  languages?: string[]
  minimum_budget?: number | null
  maximum_budget?: number | null
}

export interface PropertyLocationOption {
  value: string
  label: string
  city: string
  governorate: string
}

export const adminAgentsApi = {
  listPropertyLocations: async (): Promise<PropertyLocationOption[]> => {
    return apiClient.get<PropertyLocationOption[]>('/properties/location-options')
  },

  listLocationOptions: async (): Promise<Array<{ value: string; label: string }>> => {
    return apiClient.get<Array<{ value: string; label: string }>>('/agents/location-options')
  },

  listAgents: async (params?: {
    territory?: string
    property_type?: string
    availability_status?: string
    minimum_experience?: number
    language?: string
    minimum_budget?: number
    maximum_budget?: number
    skip?: number
    limit?: number
  }): Promise<AgentPublicResponse[]> => {
    const queryParams: Record<string, string | number> = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
    }
    if (params?.territory) queryParams.territory = params.territory
    if (params?.property_type) queryParams.property_type = params.property_type
    if (params?.availability_status) queryParams.availability_status = params.availability_status
    if (params?.minimum_experience !== undefined) queryParams.minimum_experience = params.minimum_experience
    if (params?.language) queryParams.language = params.language
    if (params?.minimum_budget !== undefined) queryParams.minimum_budget = params.minimum_budget
    if (params?.maximum_budget !== undefined) queryParams.maximum_budget = params.maximum_budget

    const response = await apiClient.get<AgentPublicResponse[]>('/agents', queryParams)
    return response
  },

  getAgent: async (agentId: string): Promise<AgentPublicResponse> => {
    const response = await apiClient.get<AgentPublicResponse>(`/agents/${agentId}`)
    return response
  },

  createAgent: async (agentData: AgentCreate): Promise<AgentPublicResponse> => {
    const response = await apiClient.post<AgentPublicResponse>('/agents', agentData)
    return response
  },

  createAgentWithAccount: async (agentData: AgentAccountCreate): Promise<AgentPublicResponse> => {
    return apiClient.post<AgentPublicResponse>('/agents/with-account', agentData)
  },

  updateAgent: async (agentId: string, agentData: AgentUpdate): Promise<AgentPublicResponse> => {
    const response = await apiClient.put<AgentPublicResponse>(`/agents/${agentId}`, agentData)
    return response
  },

  deleteAgent: async (agentId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}`)
  },
}
