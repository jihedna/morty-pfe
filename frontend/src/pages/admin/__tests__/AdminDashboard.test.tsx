import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminDashboard from '../AdminDashboard'
import { adminAnalyticsApi } from '../../../lib/adminAnalyticsApi'
import { adminAppointmentsApi } from '../../../lib/adminAppointmentsApi'

vi.mock('../../../lib/adminAnalyticsApi')
vi.mock('../../../lib/adminAppointmentsApi')

describe('AdminDashboard', () => {
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
    total_hot_leads: 5,
    total_warm_leads: 10,
    total_cold_leads: 15,
    average_lead_score: 55,
  }

  it('renders loading state', () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays dashboard metrics on successful load', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Good to see you, Manager/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total users metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Total users')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total clients metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('50 clients')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total agents metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('20 registered')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays total properties metric', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getAllByText('Properties').length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockRejectedValue(new Error('Load failed'))
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('refresh button is present', async () => {
    vi.mocked(adminAnalyticsApi.getOverview).mockResolvedValue(mockOverview)
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({ agents: [], total: 0, skip: 0, limit: 5 })
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })
})
