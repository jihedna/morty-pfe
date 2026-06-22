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
          <AdminAgents />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockAgents = [
    {
      id: 'agent-1',
      user_id: 'user-1',
      office: 'Tunis',
      phone: '+21612345678',
      years_experience: 5,
      availability_status: 'available',
      languages: ['Arabic', 'French'],
      minimum_budget: 100000,
      maximum_budget: 500000,
      user: {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      territories: [
        { id: 't1', agent_id: 'agent-1', city: 'Tunis', governorate: 'Tunis' },
      ],
      property_types: [
        { id: 'pt1', agent_id: 'agent-1', property_type: 'apartment' },
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
      expect(screen.getByText('Agent Administration')).toBeInTheDocument()
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
