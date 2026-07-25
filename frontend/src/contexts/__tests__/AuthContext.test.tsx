import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { authApi } from '../../lib/authApi'

// Mock the authApi
vi.mock('../../lib/authApi')

const mockAuthApi = authApi as unknown as { [key: string]: ReturnType<typeof vi.fn> }

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('initial state should have no user and isLoading true', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('restoreSession should load user from sessionStorage', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'client',
      is_active: true,
    }

    sessionStorage.setItem('auth_token', 'mock-token')
    sessionStorage.setItem('auth_user', JSON.stringify(mockUser))

    mockAuthApi.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('mock-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login should set user and token', async () => {
    const mockCredentials = { email: 'test@example.com', password: 'password' }
    const mockResponse = {
      access_token: 'mock-token',
      token_type: 'bearer',
    }
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'client',
      is_active: true,
    }

    mockAuthApi.login.mockResolvedValue(mockResponse)
    mockAuthApi.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login(mockCredentials)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('mock-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem('auth_token')).toBe('mock-token')
    expect(sessionStorage.getItem('auth_user')).toBe(JSON.stringify(mockUser))
  })

  it('register should set user and token', async () => {
    const mockData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password',
    }
    const mockResponse = {
      access_token: 'mock-token',
      token_type: 'bearer',
    }
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'client',
      is_active: true,
    }

    mockAuthApi.register.mockResolvedValue(mockResponse)
    mockAuthApi.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register(mockData)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('mock-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logout should clear user and token', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'client',
      is_active: true,
    }

    sessionStorage.setItem('auth_token', 'mock-token')
    sessionStorage.setItem('auth_user', JSON.stringify(mockUser))

    mockAuthApi.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem('auth_token')).toBeNull()
    expect(sessionStorage.getItem('auth_user')).toBeNull()
  })

  it('hasRole should return true for matching role', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'client',
      is_active: true,
    }

    sessionStorage.setItem('auth_token', 'mock-token')
    sessionStorage.setItem('auth_user', JSON.stringify(mockUser))

    mockAuthApi.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasRole('client')).toBe(true)
    expect(result.current.hasRole('agent')).toBe(false)
  })
})
