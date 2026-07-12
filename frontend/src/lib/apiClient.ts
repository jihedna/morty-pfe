import { API_BASE_URL } from '../config/env'

export interface ApiError {
  detail: string
  status: number
  body?: Record<string, string[]>
}

export interface ValidationError {
  detail: string
  status: number
  body?: Record<string, string[]>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T
      }
      const text = await response.text()
      if (!text) return undefined as T
      return JSON.parse(text) as T
    }

    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const data = await response.json()
      
      // Handle 401 Unauthorized - clear token
      if (response.status === 401) {
        this.setToken(null)
        // Trigger auth state update (will be handled by auth context)
        window.dispatchEvent(new CustomEvent('auth-expired'))
      }

      let detail = data.detail || data.message || 'An error occurred'
      let body: Record<string, string[]> | undefined = data.body

      if (Array.isArray(detail)) {
        body = detail.reduce<Record<string, string[]>>((acc, item) => {
          if (item && typeof item === 'object' && Array.isArray(item.loc)) {
            const field = item.loc[item.loc.length - 1] as string
            if (!acc[field]) acc[field] = []
            acc[field].push(String(item.msg || 'Invalid value'))
          }
          return acc
        }, {})
        detail = body.detail?.[0] || body[Object.keys(body)[0]]?.[0] || 'Please fix the highlighted fields'
      }

      const error: ApiError = {
        detail,
        status: response.status,
        body,
      }

      throw error
    }

    throw {
      detail: response.statusText || 'An error occurred',
      status: response.status,
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = this.buildUrl(endpoint, params)
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
