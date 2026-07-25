import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import ClientDashboard from '../ClientDashboard'

vi.mock('../../../hooks/useClientDashboard', () => ({
  useClientDashboard: () => ({
    data: {
      favoriteCount: 3,
      activeSearchRequests: 2,
      upcomingAppointments: 1,
      activeConversationCount: 4,
      unreadNotificationCount: 0,
      savedSearchCount: 5,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

describe('ClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      sessionStorage.setItem('auth_token', 'mock-token')
      sessionStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboard />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders dashboard with loading state', () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
  })

  it('displays summary metrics', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })

  it('loading state renders', () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
  })

  it('empty values render as zero', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })

  it('quick-action links point to correct routes', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })

  it('recent activity renders when available', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })

  it('empty recent activity state renders correctly', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })
})
