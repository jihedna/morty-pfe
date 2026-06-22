import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentProfile from '../AgentProfile'
import { agentApi } from '../../../lib/agentApi'

vi.mock('../../../lib/agentApi')

describe('AgentProfile', () => {
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
          <AgentProfile />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockProfile = {
    id: 'agent-1',
    user_id: 'user-1',
    office: 'Tunis',
    phone: '+21612345678',
    biography: 'Experienced agent',
    years_experience: 5,
    minimum_budget: 100000,
    maximum_budget: 500000,
    availability_status: 'available',
    active_lead_count: 10,
    success_rate: 0.85,
    closed_deals: 50,
    languages: 'English, French',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    territories: [],
    property_types: [],
  }

  it('renders loading state', () => {
    vi.mocked(agentApi.getMyProfile).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading profile/i)).toBeInTheDocument()
  })

  it('displays profile heading on successful load', async () => {
    vi.mocked(agentApi.getMyProfile).mockResolvedValue(mockProfile)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /agent profile/i })).toBeInTheDocument()
    })
  })

  it('displays contact information section', async () => {
    vi.mocked(agentApi.getMyProfile).mockResolvedValue(mockProfile)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contact information/i })).toBeInTheDocument()
    })
  })

  it('displays professional information section', async () => {
    vi.mocked(agentApi.getMyProfile).mockResolvedValue(mockProfile)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /professional information/i })).toBeInTheDocument()
    })
  })

  it('displays error message on failed load', async () => {
    vi.mocked(agentApi.getMyProfile).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })
})
