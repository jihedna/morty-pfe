import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentLeads from '../AgentLeads'
import { agentLeadsApi } from '../../../lib/agentLeadsApi'

vi.mock('../../../lib/agentLeadsApi')

describe('AgentLeads', () => {
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
          <AgentLeads />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockLead = {
    request_id: 'req-1',
    client_id: 'client-1',
    summary: 'Looking for apartment in Tunis',
    preferred_city: 'Tunis',
    preferred_district: 'Lac',
    property_type: 'apartment',
    listing_type: 'sale',
    minimum_budget: 150000,
    maximum_budget: 300000,
    minimum_bedrooms: 2,
    minimum_bathrooms: 1,
    urgency: 'high',
    lead_score: 85,
    qualification_level: 'hot',
    lead_score_reasons: ['Budget range fully specified (+20)'],
    match_percentage: 80,
    matched_criteria: { property_type: true, territory: true, budget: true, availability: true },
    recommended_action: 'Reach out today',
    created_at: '2024-01-01T00:00:00Z',
    conversation_id: null,
    appointment_count: 0,
  }

  it('renders loading state', () => {
    vi.mocked(agentLeadsApi.getLeads).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading leads/i)).toBeInTheDocument()
  })

  it('displays lead list on successful load', async () => {
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({ leads: [mockLead], total: 1, skip: 0, limit: 20 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /leads/i })).toBeInTheDocument()
    })
  })

  it('empty state displays when no leads found', async () => {
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({ leads: [], total: 0, skip: 0, limit: 20 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no leads found/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentLeadsApi.getLeads).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('renders lead score in list', async () => {
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({ leads: [mockLead], total: 1, skip: 0, limit: 20 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('hot')).toBeInTheDocument()
    })
  })

  it('renders view button for each lead', async () => {
    vi.mocked(agentLeadsApi.getLeads).mockResolvedValue({ leads: [mockLead], total: 1, skip: 0, limit: 20 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
    })
  })
})
