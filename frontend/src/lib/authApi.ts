import { apiClient } from './apiClient'
import { User, LoginResponse } from '../types'

interface ApiError {
  detail: string
  status: number
  body?: Record<string, string[]>
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    'status' in error
  )
}

export interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export class AuthApi {
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', data)
      return response
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401) {
          throw new Error('Incorrect email or password')
        }
        throw new Error(error.detail)
      }
      throw new Error('Login failed')
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', data)
      return response
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 422) {
          // Handle validation errors
          if (error.body) {
            const messages = Object.values(error.body).flat()
            throw new Error(messages.join(', '))
          }
          throw new Error('Invalid registration data')
        }
        throw new Error(error.detail)
      }
      throw new Error('Registration failed')
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me')
      return response
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401) {
          throw new Error('Not authenticated')
        }
        throw new Error(error.detail)
      }
      throw new Error('Failed to fetch user')
    }
  }

  logout(): void {
    // Local logout only - clear token from API client
    apiClient.setToken(null)
  }
}

export const authApi = new AuthApi()
