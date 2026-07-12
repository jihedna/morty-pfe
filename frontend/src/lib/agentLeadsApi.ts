import { apiClient } from './apiClient'

export interface AgentLeadFilters {
  [key: string]: string | number | boolean | undefined
  qualification?: string
  min_score?: number
  city?: string
  district?: string
  property_type?: string
  urgency?: string
  order_by?: string
  sort?: 'asc' | 'desc'
  skip?: number
  limit?: number
}

export interface MatchedCriteria {
  property_type: boolean
  territory: boolean
  budget: boolean
  availability: boolean
}

export interface AgentLeadResponse {
  request_id: string
  client_id: string
  summary: string | null
  preferred_city: string | null
  preferred_district: string | null
  property_type: string
  listing_type: string
  minimum_budget: number | null
  maximum_budget: number | null
  minimum_bedrooms: number | null
  minimum_bathrooms: number | null
  urgency: string | null
  lead_score: number
  qualification_level: string
  lead_score_reasons: string[]
  match_percentage: number
  matched_criteria: MatchedCriteria
  recommended_action: string
  created_at: string
  conversation_id: string | null
  appointment_count: number
}

export interface AgentLeadListResponse {
  leads: AgentLeadResponse[]
  total: number
  skip: number
  limit: number
}

export interface LeadScoreResponse {
  request_id: string
  lead_score: number
  qualification_level: string
  urgency: string
  lead_score_reasons: string[]
  recommended_action: string
}

export const agentLeadsApi = {
  getLeads: async (filters: AgentLeadFilters = {}): Promise<AgentLeadListResponse> => {
    const response = await apiClient.get<AgentLeadListResponse>('/agent/leads', filters)
    return response
  },

  getLead: async (requestId: string): Promise<AgentLeadResponse> => {
    const response = await apiClient.get<AgentLeadResponse>(`/agent/leads/${requestId}`)
    return response
  },

  getLeadScore: async (requestId: string): Promise<LeadScoreResponse> => {
    const response = await apiClient.get<LeadScoreResponse>(`/agent/leads/${requestId}/score`)
    return response
  },

  recalculateLead: async (requestId: string): Promise<AgentLeadResponse> => {
    const response = await apiClient.post<AgentLeadResponse>(`/agent/leads/${requestId}/recalculate`, {})
    return response
  },
}
