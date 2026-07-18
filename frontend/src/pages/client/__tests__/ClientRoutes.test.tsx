import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AppRouter from '../../../router/AppRouter'
import { clientSearchRequestsApi } from '../../../lib/clientSearchRequestsApi'
import { propertyApi } from '../../../lib/propertyApi'
import { appointmentsApi } from '../../../lib/appointmentsApi'
import { notificationsApi } from '../../../lib/notificationsApi'
import { conversationsApi } from '../../../lib/conversationsApi'
import { savedSearchesApi } from '../../../lib/savedSearchesApi'

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

    vi.mocked(clientSearchRequestsApi.getMyRequests).mockResolvedValue([])
    vi.mocked(clientSearchRequestsApi.getAgentMatches).mockResolvedValue([])
    vi.mocked(propertyApi.listFavorites).mockResolvedValue({ favorites: [], total: 0, skip: 0, limit: 20 })
    vi.mocked(appointmentsApi.getMyAppointments).mockResolvedValue([])
    vi.mocked(conversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(savedSearchesApi.getMySavedSearches).mockResolvedValue({ saved_searches: [], total: 0, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [], total: 0, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
  })

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

  it('renders dashboard with heading', async () => {
    renderRoute('/client/dashboard', clientUser)
    expect(await screen.findByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeInTheDocument()
  })

  it('renders search requests with heading', async () => {
    renderRoute('/client/search-requests', clientUser)
    expect(await screen.findByText('No Search Requests')).toBeInTheDocument()
  })

  it('renders matches with heading', async () => {
    renderRoute('/client/matches', clientUser)
    expect(await screen.findByText('No Matches Found')).toBeInTheDocument()
  })

  it('renders favorites with heading', async () => {
    renderRoute('/client/favorites', clientUser)
    expect(await screen.findByText('No favorites yet')).toBeInTheDocument()
  })

  it('renders saved searches with heading', async () => {
    renderRoute('/client/saved-searches', clientUser)
    expect(await screen.findByText('No Saved Searches')).toBeInTheDocument()
  })

  it('renders conversations with heading', async () => {
    renderRoute('/client/conversations', clientUser)
    expect(await screen.findByText('No messages yet')).toBeInTheDocument()
  })

  it('renders appointments with heading', async () => {
    renderRoute('/client/appointments', clientUser)
    expect(await screen.findByText('No Appointments')).toBeInTheDocument()
  })

  it('renders notifications with heading', async () => {
    renderRoute('/client/notifications', clientUser)
    expect(await screen.findByText('No notifications')).toBeInTheDocument()
  })

  it('does not contain "Coming Soon" on any client route', async () => {
    const routeContent: Record<string, string | RegExp> = {
      '/client/dashboard': 'Active Search Requests',
      '/client/search-requests': 'No Search Requests',
      '/client/matches': 'No Matches Found',
      '/client/favorites': 'No favorites yet',
      '/client/saved-searches': 'No Saved Searches',
      '/client/conversations': 'No messages yet',
      '/client/appointments': 'No Appointments',
      '/client/notifications': 'No notifications',
    }

    for (const route of Object.keys(routeContent)) {
      const { unmount } = renderRoute(route, clientUser)
      await screen.findByText(routeContent[route])
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      unmount()
    }
  })

  it('does not render generic placeholder on client routes', async () => {
    const routeContent: Record<string, string | RegExp> = {
      '/client/dashboard': 'Active Search Requests',
      '/client/search-requests': 'No Search Requests',
      '/client/matches': 'No Matches Found',
      '/client/favorites': 'No favorites yet',
      '/client/saved-searches': 'No Saved Searches',
      '/client/conversations': 'No messages yet',
      '/client/appointments': 'No Appointments',
      '/client/notifications': 'No notifications',
    }

    for (const route of Object.keys(routeContent)) {
      const { unmount } = renderRoute(route, clientUser)
      await screen.findByText(routeContent[route])
      const body = document.body
      expect(body.textContent).not.toBe('Coming Soon')
      expect(body.textContent).not.toBe('Placeholder')
      expect(body.textContent).not.toBe('TODO')
      unmount()
    }
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
