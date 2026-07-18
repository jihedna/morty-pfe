import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentDashboard from '../AgentDashboard'
import { agentPropertiesApi } from '../../../lib/agentPropertiesApi'
import { agentAppointmentsApi } from '../../../lib/agentAppointmentsApi'
import { agentConversationsApi } from '../../../lib/agentConversationsApi'
import { agentLeadsApi } from '../../../lib/agentLeadsApi'
import { notificationsApi } from '../../../lib/notificationsApi'

vi.mock('../../../lib/agentPropertiesApi')
vi.mock('../../../lib/agentAppointmentsApi')
vi.mock('../../../lib/agentConversationsApi')
vi.mock('../../../lib/agentLeadsApi')
vi.mock('../../../lib/notificationsApi')

describe('AgentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({ leads: [], total: 0, skip: 0, limit: 100 })
    vi.mocked(agentConversationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
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
          <AgentDashboard />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders loading state', () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockReturnValue(new Promise(() => {}))
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockReturnValue(new Promise(() => {}))
    vi.mocked(agentConversationsApi.getMyConversations).mockReturnValue(new Promise(() => {}))
    vi.mocked(notificationsApi.getUnreadCount).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading your agent dashboard/i)).toBeInTheDocument()
  })

  it('displays dashboard heading on successful load', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeInTheDocument()
    })
  })

  it('displays summary metrics', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/active leads/i)).toBeInTheDocument()
    expect(screen.getAllByText(/active listings/i)[0]).toBeInTheDocument()
  })

  it('metric cards display correct labels', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/active leads/i)).toBeInTheDocument()
    expect(screen.getAllByText(/upcoming appointments/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/active listings/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/leads pipeline/i)).toBeInTheDocument()
  })

  it('quick-action links point to correct routes', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /new listing/i })).toHaveAttribute('href', '/agent/properties/new')
    expect(screen.getByRole('link', { name: /view all leads/i })).toHaveAttribute('href', '/agent/leads')
    expect(screen.getAllByRole('link', { name: /view all/i }).some((link) => link.getAttribute('href') === '/agent/appointments')).toBe(true)
  })

  it('groups real leads by qualification and renders deterministic scores', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({
      leads: [{
        request_id: 'request-1',
        client_id: 'client-1',
        summary: 'Apartment search',
        preferred_city: 'Tunis',
        preferred_district: null,
        property_type: 'apartment',
        listing_type: 'sale',
        minimum_budget: 200000,
        maximum_budget: 300000,
        minimum_bedrooms: 2,
        minimum_bathrooms: 1,
        urgency: 'high',
        lead_score: 82,
        qualification_level: 'hot',
        lead_score_reasons: ['Urgent request'],
        match_percentage: 90,
        matched_criteria: { property_type: true, territory: true, budget: true, availability: true },
        recommended_action: 'Contact client',
        created_at: '2025-01-01T10:00:00Z',
        conversation_id: null,
        appointment_count: 0,
      }],
      total: 1,
      skip: 0,
      limit: 100,
    })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(await screen.findByText('Apartment search')).toBeInTheDocument()
    expect(screen.getByText('82/100')).toBeInTheDocument()
    expect(screen.getByText(/hot \(1\)/i)).toBeInTheDocument()
  })

  it('empty state displays zero values', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/active leads/i)).toBeInTheDocument()
    expect(screen.getAllByText(/active listings/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })
})
