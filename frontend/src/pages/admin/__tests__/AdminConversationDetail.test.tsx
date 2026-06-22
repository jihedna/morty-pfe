import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminConversationDetail from '../AdminConversationDetail'
import { adminConversationsApi } from '../../../lib/adminConversationsApi'

vi.mock('../../../lib/adminConversationsApi')

describe('AdminConversationDetail', () => {
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
      <MemoryRouter initialEntries={['/admin/conversations/conv-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/conversations" element={<div>Conversations List</div>} />
            <Route path="/admin/conversations/:conversationId" element={<AdminConversationDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockConversation = {
    id: 'conv-1',
    subject: 'Test Conversation',
    property_id: 'prop-1',
    search_request_id: null,
    client_id: 'client-1',
    agent_id: 'agent-1',
    is_active: true,
    client_last_read_at: '2024-01-01T00:00:00Z',
    agent_last_read_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    messages: [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_user_id: 'client-1',
        content: 'Hello, I am interested in this property',
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }

  it('renders loading state', () => {
    vi.mocked(adminConversationsApi.getConversation).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays conversation detail on successful load', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })
  })

  it('displays conversation subject', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })
  })

  it('displays back button', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/Back to conversations/i)).toBeInTheDocument()
    })
  })

  it('displays read-only message', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/Read-only view \(managers cannot send messages\)/)).toBeInTheDocument()
    })
  })

  it('displays message content', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockResolvedValue(mockConversation)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Hello, I am interested in this property')).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('displays not found error for 404', async () => {
    vi.mocked(adminConversationsApi.getConversation).mockRejectedValue(new Error('404'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/Conversation not found/i)).toBeInTheDocument()
    })
  })
})
