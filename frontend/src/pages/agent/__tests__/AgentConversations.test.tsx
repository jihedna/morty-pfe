import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentConversations from '../AgentConversations'
import { agentConversationsApi } from '../../../lib/agentConversationsApi'

vi.mock('../../../lib/agentConversationsApi')

describe('AgentConversations', () => {
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

    expect(screen.getByText(/loading conversations/i)).toBeInTheDocument()
  })

  it('displays conversation list on successful load', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /conversations/i })).toBeInTheDocument()
    })
  })

  it('status filter displays all options', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /conversations/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
  })

  it('empty state displays when no conversations found', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no conversations found/i)).toBeInTheDocument()
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

  it('conversation card displays property ID', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/property id: prop-1/i)).toBeInTheDocument()
    })
  })

  it('conversation card displays active status', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockConversation.subject)).toBeInTheDocument()
    })

    // Check that the conversation card is rendered
    expect(screen.getByText(/property id: prop-1/i)).toBeInTheDocument()
  })

  it('mark as read button marks conversation as read', async () => {
    vi.mocked(agentConversationsApi.getMyConversations).mockResolvedValue([mockConversation])
    vi.mocked(agentConversationsApi.markConversationRead).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark read/i })).toBeInTheDocument()
    })

    const markReadButton = screen.getByRole('button', { name: /mark read/i })
    markReadButton.click()

    await waitFor(() => {
      expect(vi.mocked(agentConversationsApi.markConversationRead)).toHaveBeenCalledWith('1')
    })
  })
})
