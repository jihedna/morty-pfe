/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '../types'
import { authApi, RegisterData, LoginData } from '../lib/authApi'
import { apiClient } from '../lib/apiClient'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginData) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => void
  restoreSession: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
// Authentication must be isolated per browser tab. localStorage is shared by
// every tab on the same origin and caused two agent tabs to use the last login.
const authStorage = sessionStorage

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Load the authentication state for this tab only.
  useEffect(() => {
    const storedToken = authStorage.getItem(TOKEN_KEY)
    const storedUser = authStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User
        setToken(storedToken)
        setUser(parsedUser)
        apiClient.setToken(storedToken)
      } catch (error) {
        // Clear invalid stored data
        authStorage.removeItem(TOKEN_KEY)
        authStorage.removeItem(USER_KEY)
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

  const login = async (credentials: LoginData): Promise<User> => {
    setIsAuthenticating(true)
    try {
      const response = await authApi.login(credentials)
      
      setToken(response.access_token)
      authStorage.setItem(TOKEN_KEY, response.access_token)
      apiClient.setToken(response.access_token)
      
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      authStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      return currentUser
    } finally {
      setIsAuthenticating(false)
    }
  }

  const register = async (data: RegisterData): Promise<User> => {
    setIsAuthenticating(true)
    try {
      const response = await authApi.register(data)
      
      setToken(response.access_token)
      authStorage.setItem(TOKEN_KEY, response.access_token)
      apiClient.setToken(response.access_token)
      
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      authStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      return currentUser
    } finally {
      setIsAuthenticating(false)
    }
  }

  const restoreSession = async () => {
    const storedToken = authStorage.getItem(TOKEN_KEY)
    
    if (!storedToken) {
      return
    }
    
    try {
      setToken(storedToken)
      apiClient.setToken(storedToken)
      
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      authStorage.setItem(USER_KEY, JSON.stringify(currentUser))
    } catch (error) {
      // Clear invalid session
      logout()
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    
    // Clear this tab's session without logging out other tabs.
    authStorage.removeItem(TOKEN_KEY)
    authStorage.removeItem(USER_KEY)
    
    // Update API client
    apiClient.setToken(null)
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading: isLoading || isAuthenticating,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    restoreSession,
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
