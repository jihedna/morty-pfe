import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentAppointments from '../AgentAppointments'
import { agentAppointmentsApi } from '../../../lib/agentAppointmentsApi'

vi.mock('../../../lib/agentAppointmentsApi')

describe('AgentAppointments', () => {
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
          <AgentAppointments />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockAppointment = {
    id: '1',
    client: {
      id: 'client-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    agent: {
      id: 'agent-1',
      office: 'Tunis',
      phone: '+21612345678',
      user: {
        id: 'user-1',
        first_name: 'Agent',
        last_name: 'Name',
        email: 'agent@example.com',
      },
    },
    property: {
      id: 'prop-1',
      reference_code: 'REF001',
      title: 'Test Property',
      status: 'available',
    },
    conversation_id: null,
    scheduled_start: '2024-01-01T10:00:00',
    scheduled_end: '2024-01-01T11:00:00',
    status: 'requested',
    client_notes: 'Test notes',
    agent_notes: null,
    cancellation_reason: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  it('renders loading state', () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading appointments/i)).toBeInTheDocument()
  })

  it('displays appointment list on successful load', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([mockAppointment])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
    })
  })

  it('status filter displays all options', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([mockAppointment])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
  })

  it('empty state displays when no appointments found', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no appointments found/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('appointment card displays property title', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([mockAppointment])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockAppointment.property.title)).toBeInTheDocument()
    })
  })

  it('appointment card displays client name', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([mockAppointment])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })
  })

  it('appointment card displays status', async () => {
    vi.mocked(agentAppointmentsApi.getAgentAppointments).mockResolvedValue([mockAppointment])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockAppointment.status)).toBeInTheDocument()
    })
  })
})
