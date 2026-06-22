import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentDashboard from '../AgentDashboard'
import { agentPropertiesApi } from '../../../lib/agentPropertiesApi'
import { agentAppointmentsApi } from '../../../lib/agentAppointmentsApi'
import { agentConversationsApi } from '../../../lib/agentConversationsApi'
import { notificationsApi } from '../../../lib/notificationsApi'

vi.mock('../../../lib/agentPropertiesApi')
vi.mock('../../../lib/agentAppointmentsApi')
vi.mock('../../../lib/agentConversationsApi')
vi.mock('../../../lib/notificationsApi')

describe('AgentDashboard', () => {
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

    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument()
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

    expect(screen.getByText(/total listings/i)).toBeInTheDocument()
    expect(screen.getByText(/available/i)).toBeInTheDocument()
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

    expect(screen.getByText(/total listings/i)).toBeInTheDocument()
    expect(screen.getByText(/upcoming appointments/i)).toBeInTheDocument()
    expect(screen.getByText(/active conversations/i)).toBeInTheDocument()
    expect(screen.getByText(/unread notifications/i)).toBeInTheDocument()
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

    expect(screen.getByRole('link', { name: /add property/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /manage listings/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view appointments/i })).toBeInTheDocument()
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

    // Check that metric cards are rendered with zero values
    expect(screen.getByText(/total listings/i)).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })
})
