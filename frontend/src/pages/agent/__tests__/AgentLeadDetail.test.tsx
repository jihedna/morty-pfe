import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentLeadDetail from '../AgentLeadDetail'
import { agentLeadsApi } from '../../../lib/agentLeadsApi'

vi.mock('../../../lib/agentLeadsApi')

describe('AgentLeadDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

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

  const mockRecalculatedLead = { ...mockLead, lead_score: 95, recommended_action: 'Updated recommendation' }

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={['/agent/leads/req-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/agent/leads/:requestId" element={<AgentLeadDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders loading state', () => {
    vi.mocked(agentLeadsApi.getLead).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText('Loading lead details…')).toBeInTheDocument()
  })

  it('displays lead details on successful load', async () => {
    vi.mocked(agentLeadsApi.getLead).mockResolvedValue(mockLead)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /lead details/i })).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText(/reach out today/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentLeadsApi.getLead).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('recalculate button triggers recalc', async () => {
    vi.mocked(agentLeadsApi.getLead).mockResolvedValue(mockLead)
    vi.mocked(agentLeadsApi.recalculateLead).mockResolvedValue(mockRecalculatedLead)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recalculate score/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /recalculate score/i }))

    await waitFor(() => {
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(vi.mocked(agentLeadsApi.recalculateLead)).toHaveBeenCalledWith('req-1')
    })
  })
})
