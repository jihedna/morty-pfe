import { apiClient } from './apiClient'

export type ContractType = 'sale' | 'rent'
export type ContractStatus = 'pending' | 'approved' | 'rejected'

export interface ContractResponse {
  id: string
  property_id: string | null
  search_request_id: string | null
  agent_id: string
  client_id: string | null
  sale_date: string
  amount: number
  city: string
  district: string | null
  property_type: string
  area_sqm: number | null
  contract_type: ContractType
  status: ContractStatus
  created_at: string
}

export interface ContractListResponse {
  contracts: ContractResponse[]
  total: number
  skip: number
  limit: number
}

export interface ContractCreate {
  agent_id: string
  sale_date: string
  amount: number
  city: string
  district?: string
  property_type: string
  area_sqm?: number
  contract_type: ContractType
  property_id?: string
  client_id?: string
}

export interface ContractUpdate {
  sale_date?: string
  amount?: number
  city?: string
  district?: string
  property_type?: string
  area_sqm?: number
  contract_type?: ContractType
  status?: ContractStatus
}

export interface ContractAnalytics {
  total_contracts: number
  total_sales: number
  total_rents: number
  total_sales_amount: number
  total_rent_amount: number
  average_sale_amount: number
  average_rent_amount: number
  by_city: { city: string; count: number }[]
  by_property_type: { property_type: string; count: number }[]
  monthly_trend: { month: string; count: number; amount: number }[]
}

export interface ContractFilters {
  city?: string
  contract_type?: ContractType
  agent_id?: string
  skip?: number
  limit?: number
}

function buildParams(filters: ContractFilters): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {}
  if (filters.city) p['city'] = filters.city
  if (filters.contract_type) p['contract_type'] = filters.contract_type
  if (filters.agent_id) p['agent_id'] = filters.agent_id
  if (filters.skip !== undefined) p['skip'] = filters.skip
  if (filters.limit !== undefined) p['limit'] = filters.limit
  return p
}

export const adminContractsApi = {
  list: async (filters: ContractFilters = {}): Promise<ContractListResponse> => {
    return apiClient.get<ContractListResponse>('/admin/contracts', buildParams(filters))
  },

  get: async (id: string): Promise<ContractResponse> => {
    return apiClient.get<ContractResponse>(`/admin/contracts/${id}`)
  },

  create: async (data: ContractCreate): Promise<ContractResponse> => {
    return apiClient.post<ContractResponse>('/admin/contracts', data)
  },

  update: async (id: string, data: ContractUpdate): Promise<ContractResponse> => {
    return apiClient.patch<ContractResponse>(`/admin/contracts/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/contracts/${id}`)
  },

  getAnalytics: async (): Promise<ContractAnalytics> => {
    return apiClient.get<ContractAnalytics>('/admin/analytics/contracts')
  },
}
