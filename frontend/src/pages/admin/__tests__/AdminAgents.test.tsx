import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminAgents from '../AdminAgents'
import { adminAgentsApi } from '../../../lib/adminAgentsApi'

vi.mock('../../../lib/adminAgentsApi')

describe('AdminAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(adminAgentsApi.listLocationOptions).mockResolvedValue([])
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
          <AdminAgents />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockAgents = [
    {
      id: 'agent-1',
      office: 'Tunis',
      phone: '+21612345678',
      biography: null,
      years_experience: 5,
      availability_status: 'available',
      languages: 'Arabic, French',
      minimum_budget: 100000,
      maximum_budget: 500000,
      active_lead_count: 3,
      success_rate: 0.75,
      closed_deals: 10,
      user: {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      territories: [
        { id: 't1', agent_id: 'agent-1', territory: 'Tunis', expertise_score: 0.8 },
      ],
      property_types: [
        { id: 'pt1', agent_id: 'agent-1', property_type: 'apartment', expertise_score: 0.9 },
      ],
    },
  ]

  it('renders loading state', () => {
    vi.mocked(adminAgentsApi.listAgents).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays agents list on successful load', async () => {
    vi.mocked(adminAgentsApi.listAgents).mockResolvedValue(mockAgents)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Agent Administration' })).toBeInTheDocument()
    })
  })

  it('displays agent name in table', async () => {
    vi.mocked(adminAgentsApi.listAgents).mockResolvedValue(mockAgents)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('displays filters section', async () => {
    vi.mocked(adminAgentsApi.listAgents).mockResolvedValue(mockAgents)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByLabelText('Territory')).toBeInTheDocument()
      expect(screen.getByLabelText('Property Type')).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminAgentsApi.listAgents).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('displays empty state when no agents found', async () => {
    vi.mocked(adminAgentsApi.listAgents).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/No agents found matching the current filters/)).toBeInTheDocument()
    })
  })
})
