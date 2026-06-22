import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminDashboard from '../AdminDashboard'
import { adminAnalyticsApi } from '../../../lib/adminAnalyticsApi'

vi.mock('../../../lib/adminAnalyticsApi')

describe('AdminDashboard', () => {
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
      <MemoryRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockOverview = {
    total_users: 100,
    total_clients: 50,
    total_agents: 20,
    active_agents: 15,
    total_properties: 200,
    available_properties: 150,
    reserved_properties: 20,
    sold_properties: 25,
    rented_properties: 5,
    archived_properties: 10,
    total_client_search_requests: 30,
    active_client_search_requests: 20,
    total_conversations: 40,
    active_conversations: 30,
    total_messages: 500,
    unread_notifications: 10,
    total_appointments: 60,
    upcoming_appointments: 15,
    completed_appointments: 40,
    cancelled_appointments: 5,
    total_favorites: 100,
    active_saved_searches: 25,
  }

  it('renders loading state', () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays dashboard metrics on successful load', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Manager Dashboard')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total users metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total clients metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Total Clients')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total agents metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Total Agents')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total properties metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Total Properties')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('refresh button is present', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })
})
