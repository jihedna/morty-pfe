import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminAnalytics from '../AdminAnalytics'
import { adminAnalyticsApi } from '../../../lib/adminAnalyticsApi'

vi.mock('../../../lib/adminAnalyticsApi')

describe('AdminAnalytics', () => {
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
          <AdminAnalytics />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockPropertyAnalytics = {
    total_properties: 200,
    properties_by_status: { available: 150, reserved: 20, sold: 25, rented: 5 },
    properties_by_type: { apartment: 100, house: 50, villa: 30, land: 20 },
    properties_by_listing_type: { sale: 150, rent: 50 },
    properties_by_city: { Tunis: 100, Sfax: 50, Sousse: 50 },
    average_sale_price: 200000,
    average_rental_price: 500,
    minimum_price: 50000,
    maximum_price: 500000,
    featured_count: 20,
    created_in_period: 10,
    sold_or_rented_in_period: 5,
  }

  const mockAgentAnalytics = {
    agents: [
      {
        agent_id: '1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        years_experience: 5,
        total_listings: 50,
        available_listings: 30,
        sold_listings: 15,
        rented_listings: 5,
        appointment_count: 20,
        completed_appointment_count: 15,
        conversation_count: 10,
        received_favorites: 5,
      },
    ],
    total: 1,
    skip: 0,
    limit: 20,
  }

  const mockClientAnalytics = {
    total_clients: 50,
    active_clients: 40,
    clients_with_search_requests: 30,
    clients_with_favorites: 25,
    clients_with_saved_searches: 20,
    clients_with_conversations: 35,
    clients_with_appointments: 15,
    average_favorites_per_client: 2.5,
    average_saved_searches_per_client: 1.5,
    average_appointments_per_client: 0.5,
  }

  const mockAppointmentAnalytics = {
    total_appointments: 60,
    requested: 10,
    confirmed: 30,
    rescheduled: 5,
    cancelled: 5,
    completed: 40,
    no_show: 5,
    completion_rate: 0.67,
    cancellation_rate: 0.08,
    no_show_rate: 0.08,
    upcoming_count: 15,
    appointments_by_day: { '2024-01-01': 5, '2024-01-02': 10 },
    appointments_by_agent: { 'agent-1': 30, 'agent-2': 30 },
  }

  const mockEngagementAnalytics = {
    total_conversations: 40,
    active_conversations: 30,
    total_messages: 500,
    average_messages_per_conversation: 12.5,
    total_notifications: 100,
    unread_notifications: 10,
    notification_read_rate: 0.9,
    total_favorites: 100,
    total_saved_searches: 25,
    saved_searches_with_notifications_enabled: 20,
    clients_with_engagement: 35,
  }

  it('renders loading state', () => {
    vi.mocked(adminAnalyticsApi.getPropertyAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getClientAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getAppointmentAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getEngagementAnalytics).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
