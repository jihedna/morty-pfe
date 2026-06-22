/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, LoginResponse, UserRole } from '../types'
import { apiClient } from '../lib/apiClient'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User
        setToken(storedToken)
        setUser(parsedUser)
        apiClient.setToken(storedToken)
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }

    setIsLoading(false)

    // Listen for auth expiration events
    const handleAuthExpired = () => {
      logout()
    }

    window.addEventListener('auth-expired', handleAuthExpired)

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    
    setToken(response.access_token)
    setUser(response.user)
    
    // Store in localStorage
    localStorage.setItem(TOKEN_KEY, response.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    
    // Update API client
    apiClient.setToken(response.access_token)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    
    // Update API client
    apiClient.setToken(null)
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
