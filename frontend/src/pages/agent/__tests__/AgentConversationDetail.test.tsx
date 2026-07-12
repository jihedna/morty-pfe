import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentConversationDetail from '../AgentConversationDetail'
import { agentConversationsApi } from '../../../lib/agentConversationsApi'

vi.mock('../../../lib/agentConversationsApi')

describe('AgentConversationDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderWithAuth = (user: { id: string; role: string } | null, conversationId: string = '1') => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={[`/agent/conversations/${conversationId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/agent/conversations/:conversationId" element={<AgentConversationDetail />} />
          </Routes>
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
    messages: [
      {
        id: 'msg-1',
        conversation_id: '1',
        sender_user_id: 'client-1',
        content: 'Hello',
        is_deleted: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
  }

  it('renders loading state', () => {
    vi.mocked(agentConversationsApi.getConversation).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading conversation/i)).toBeInTheDocument()
  })

  it('displays conversation messages on successful load', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockResolvedValue(mockConversation)
    vi.mocked(agentConversationsApi.markConversationRead).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockConversation.subject)).toBeInTheDocument()
    })
  })

  it('displays message input field', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockResolvedValue(mockConversation)
    vi.mocked(agentConversationsApi.markConversationRead).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('404 error displays conversation not found message', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockRejectedValue(new Error('404 Not Found'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/conversation not found/i)).toBeInTheDocument()
    })
  })

  it('back button navigates to conversations list', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockResolvedValue(mockConversation)
    vi.mocked(agentConversationsApi.markConversationRead).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/back to conversations/i)).toBeInTheDocument()
    })
  })

  it('sends a message when pressing Enter', async () => {
    vi.mocked(agentConversationsApi.getConversation).mockResolvedValue(mockConversation)
    vi.mocked(agentConversationsApi.markConversationRead).mockResolvedValue(mockConversation)
    vi.mocked(agentConversationsApi.createMessage).mockResolvedValue({
      id: 'msg-2',
      conversation_id: '1',
      sender_user_id: 'agent-1',
      content: 'New message',
      is_deleted: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(textarea, { target: { value: 'New message' } })
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(vi.mocked(agentConversationsApi.createMessage)).toHaveBeenCalledWith('1', { content: 'New message' })
      expect(screen.getByText('New message')).toBeInTheDocument()
    })
  })
})
