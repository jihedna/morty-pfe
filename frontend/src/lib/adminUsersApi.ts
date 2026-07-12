import { apiClient } from './apiClient'

export interface UserResponse {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UsersListResponse {
  users: UserResponse[]
  total: number
  skip: number
  limit: number
}

export const adminUsersApi = {
  listUsers: async (params?: {
    skip?: number
    limit?: number
    role?: string
    is_active?: boolean
    search?: string
  }): Promise<UsersListResponse> => {
    const q: Record<string, string | number | boolean> = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
    }
    if (params?.role) q.role = params.role
    if (params?.is_active !== undefined) q.is_active = params.is_active
    if (params?.search) q.q = params.search
    return apiClient.get<UsersListResponse>('/admin/users', q)
  },

  getUser: async (userId: string): Promise<UserResponse> =>
    apiClient.get<UserResponse>(`/admin/users/${userId}`),

  activateUser: async (userId: string): Promise<UserResponse> =>
    apiClient.patch<UserResponse>(`/admin/users/${userId}/activate`),

  deactivateUser: async (userId: string): Promise<UserResponse> =>
    apiClient.patch<UserResponse>(`/admin/users/${userId}/deactivate`),
}
