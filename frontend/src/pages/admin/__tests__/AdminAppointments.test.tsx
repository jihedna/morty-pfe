import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminAppointments from '../AdminAppointments'
import { adminAppointmentsApi } from '../../../lib/adminAppointmentsApi'

vi.mock('../../../lib/adminAppointmentsApi')

describe('AdminAppointments', () => {
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
          <AdminAppointments />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockAppointments = [
    {
      id: 'apt-1',
      property_id: 'prop-1',
      client_id: 'client-1',
      agent_id: 'agent-1',
      scheduled_start: '2024-01-01T10:00:00Z',
      scheduled_end: '2024-01-01T11:00:00Z',
      status: 'confirmed',
      client_notes: null,
      agent_notes: null,
      cancellation_reason: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      property: {
        id: 'prop-1',
        reference_code: 'REF001',
        title: 'Test Property',
        status: 'available',
      },
      client: {
        id: 'client-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      },
      agent: {
        id: 'agent-1',
        office: 'Tunis',
        phone: '+21612345678',
        user: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
      conversation_id: null,
    },
  ]

  it('renders loading state', () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays appointments list on successful load', async () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue(mockAppointments)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Appointment Administration')).toBeInTheDocument()
    })
  })

  it('displays property title in table', async () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue(mockAppointments)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument()
    })
  })

  it('displays filters section', async () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue(mockAppointments)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Agent ID')).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('displays empty state when no appointments found', async () => {
    vi.mocked(adminAppointmentsApi.getAllAppointments).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/No appointments found matching the current filters/)).toBeInTheDocument()
    })
  })
})
