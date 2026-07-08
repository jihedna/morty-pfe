import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AppRouter from '../../../router/AppRouter'

// Mock all API modules to prevent real network requests
vi.mock('../../../lib/clientSearchRequestsApi')
vi.mock('../../../lib/propertyApi')
vi.mock('../../../lib/appointmentsApi')
vi.mock('../../../lib/notificationsApi')
vi.mock('../../../lib/conversationsApi')
vi.mock('../../../lib/savedSearchesApi')

// Mock the useClientDashboard hook
vi.mock('../../../hooks/useClientDashboard', () => ({
  useClientDashboard: () => ({
    data: {
      activeSearchRequests: 5,
      favoriteCount: 10,
      savedSearchCount: 3,
      upcomingAppointments: 2,
      unreadNotificationCount: 4,
      activeConversationCount: 6,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

describe('Client Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={['/client/dashboard']}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const renderRoute = (path: string, user: { id: string; role: string }) => {
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify(user))

    return render(
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const clientUser = { id: 'client-1', role: 'client' as const }

  it('renders dashboard with heading', () => {
    renderRoute('/client/dashboard', clientUser)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders search requests with heading', () => {
    renderRoute('/client/search-requests', clientUser)
    expect(screen.getByRole('heading', { name: /search requests/i })).toBeInTheDocument()
  })

  it('renders matches with heading', () => {
    renderRoute('/client/matches', clientUser)
    expect(screen.getByRole('heading', { name: /agent matches/i })).toBeInTheDocument()
  })

  it('renders favorites with heading', () => {
    renderRoute('/client/favorites', clientUser)
    expect(screen.getByRole('heading', { name: /favorites/i })).toBeInTheDocument()
  })

  it('renders saved searches with heading', () => {
    renderRoute('/client/saved-searches', clientUser)
    expect(screen.getByRole('heading', { name: /saved searches/i })).toBeInTheDocument()
  })

  it('renders conversations with heading', () => {
    renderRoute('/client/conversations', clientUser)
    expect(screen.getByRole('heading', { name: /messages/i })).toBeInTheDocument()
  })

  it('renders appointments with heading', () => {
    renderRoute('/client/appointments', clientUser)
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
  })

  it('renders notifications with heading', () => {
    renderRoute('/client/notifications', clientUser)
    expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument()
  })

  it('does not contain "Coming Soon" on any client route', () => {
    const routes = [
      '/client/dashboard',
      '/client/search-requests',
      '/client/matches',
      '/client/favorites',
      '/client/saved-searches',
      '/client/conversations',
      '/client/appointments',
      '/client/notifications',
    ]

    routes.forEach((route) => {
      const { unmount } = renderRoute(route, clientUser)
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      unmount()
    })
  })

  it('does not render generic placeholder on client routes', () => {
    const routes = [
      '/client/dashboard',
      '/client/search-requests',
      '/client/matches',
      '/client/favorites',
      '/client/saved-searches',
      '/client/conversations',
      '/client/appointments',
      '/client/notifications',
    ]

    routes.forEach((route) => {
      const { unmount } = renderRoute(route, clientUser)
      // Check that we have actual content, not just a div with placeholder text
      const body = document.body
      expect(body.textContent).not.toBe('Coming Soon')
      expect(body.textContent).not.toBe('Placeholder')
      expect(body.textContent).not.toBe('TODO')
      unmount()
    })
  })

  it('requires client user for protected routes', () => {
    // Test that agent user is rejected
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'agent-1', role: 'agent' }))
    
    render(
      <MemoryRouter initialEntries={['/client/dashboard']}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>
    )
    
    // Should redirect or show unauthorized
    const accessDenied = screen.queryByText(/access denied/i)
    const unauthorized = screen.queryByText(/unauthorized/i)
    expect(accessDenied || unauthorized).toBeTruthy()
  })

  it('requires client user for protected routes - manager', () => {
    // Test that manager user is rejected
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'manager-1', role: 'manager' }))
    
    render(
      <MemoryRouter initialEntries={['/client/dashboard']}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>
    )
    
    // Should redirect or show unauthorized
    const accessDenied = screen.queryByText(/access denied/i)
    const unauthorized = screen.queryByText(/unauthorized/i)
    expect(accessDenied || unauthorized).toBeTruthy()
  })
})
