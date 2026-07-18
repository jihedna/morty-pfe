import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminAnalytics from '../AdminAnalytics'
import { adminAnalyticsApi } from '../../../lib/adminAnalyticsApi'
import { adminAgentsApi } from '../../../lib/adminAgentsApi'

vi.mock('../../../lib/adminAnalyticsApi')
vi.mock('../../../lib/adminAgentsApi')
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: React.ReactNode }) => <div data-testid="circle-marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    vi.mocked(adminAnalyticsApi.getTimeSeries).mockResolvedValue({
      metric: 'search_requests',
      interval: 'day',
      points: [],
    })
    vi.mocked(adminAnalyticsApi.getLeadAnalytics).mockResolvedValue({
      total_search_requests: 0,
      active_search_requests: 0,
      scored_leads: 0,
      unscored_leads: 0,
      total_hot_leads: 0,
      total_warm_leads: 0,
      total_cold_leads: 0,
      average_lead_score: null,
      leads_by_property_type: {},
      leads_by_city: {},
      leads_by_urgency: {},
    })
    vi.mocked(adminAnalyticsApi.getAppointmentAnalytics).mockResolvedValue({
      total_appointments: 0,
      requested: 0,
      confirmed: 0,
      rescheduled: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0,
      completion_rate: 0,
      cancellation_rate: 0,
      no_show_rate: 0,
      upcoming_count: 0,
      appointments_by_day: {},
      appointments_by_agent: {},
    })
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockResolvedValue({
      agents: [],
      total: 0,
      skip: 0,
      limit: 5,
    })
    vi.mocked(adminAnalyticsApi.getHeatMap).mockResolvedValue([])
    vi.mocked(adminAgentsApi.listAgents).mockResolvedValue([])
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
          <AdminAnalytics />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders the analytics page and chart heading', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Lead Volume vs. Conversion Rate/i)).toBeInTheDocument()
    })
  })

  it('renders the lead funnel section', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/Lead Funnel/i)).toBeInTheDocument()
    })
  })

  it('renders the top agents and heat map sections', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/Top Performing Agents/i)).toBeInTheDocument()
      expect(screen.getByText(/Regional Heat Map/i)).toBeInTheDocument()
    })
  })
})
