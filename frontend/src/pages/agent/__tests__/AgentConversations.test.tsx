import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentConversations from '../AgentConversations'
import { agentConversationsApi } from '../../../lib/agentConversationsApi'

vi.mock('../../../lib/agentConversationsApi')

describe('AgentConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
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
          <AgentConversations />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockConversation = {
    id: '1',
    subject: 'Test Conversation',
    property_id: 'prop-1',
    search_request_id: null,
    client_id: 'client-1',
    agent_id: 'agent-1',
    is_active: true,
    client_last_read_at: null,
    agent_last_read_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  it('renders loading state', () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays conversation list on successful load', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /messages/i })).toBeInTheDocument()
    })
  })

  it('displays the message search field', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /messages/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/search messages/i)).toBeInTheDocument()
  })

  it('empty state displays when no conversations found', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('conversation card displays subject', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockConversation.subject)).toBeInTheDocument()
    })
  })

  it('search filters conversations by subject', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockConversation.subject)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/search messages/i), { target: { value: 'missing' } })
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  it('conversation links to its detail page', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockConversation.subject)).toBeInTheDocument()
    })

    expect(screen.getByText(mockConversation.subject).closest('a')).toHaveAttribute('href', '/agent/conversations/1')
  })

  it('offers a link back to leads', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /view leads/i })).toBeInTheDocument()
    })
  })
})
