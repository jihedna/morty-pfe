import { apiClient } from './apiClient'
import type { ContractListResponse, ContractStatus } from './adminContractsApi'
import type { PropertyResponse } from './agentPropertiesApi'

export const clientDealsApi = {
  listMyDeals: (status?: ContractStatus, skip = 0, limit = 50) =>
    apiClient.get<ContractListResponse>('/client/contracts/me', { status, skip, limit }),
  getDealProperty: (contractId: string) =>
    apiClient.get<PropertyResponse>(`/client/contracts/${contractId}/property`),
}
