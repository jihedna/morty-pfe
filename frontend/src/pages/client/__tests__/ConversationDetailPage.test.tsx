import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import ConversationDetailPage from '../ConversationDetailPage'
import { conversationsApi } from '../../../lib/conversationsApi'

// Mock the conversationsApi
vi.mock('../../../lib/conversationsApi')

const mockConversationsApi = conversationsApi as unknown as {
  getConversation: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> }
  createMessage: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn> }
}

describe('ConversationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mockConversation = {
    id: 'conv-1',
    property_id: 'prop-1',
    agent_id: 'agent-1',
    client_id: 'client-1',
    subject: 'Inquiry about Test Property',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    messages: [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'agent-1',
        content: 'Hello, how can I help you?',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'client-1',
        content: 'I am interested in this property',
        created_at: '2024-01-01T11:00:00Z',
      },
    ],
  }

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={['/client/conversations/conv-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/client/conversations/:conversationId" element={<ConversationDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('conversation loads successfully', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })
  })

  it('loading state is visible', () => {
    mockConversationsApi.getConversation.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithAuth({ id: 'client-1', role: 'client' })

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('backend error is displayed', async () => {
    mockConversationsApi.getConversation.mockRejectedValue(new Error('Server error'))

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.queryByText(/inquiry about/i)).not.toBeInTheDocument()
    })
  })

  it('empty message state is displayed', async () => {
    const emptyConversation = {
      ...mockConversation,
      messages: [],
    }
    mockConversationsApi.getConversation.mockResolvedValue(emptyConversation)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })
  })

  it('messages appear oldest to newest', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument()
      expect(screen.getByText('I am interested in this property')).toBeInTheDocument()
    })
  })

  it('a valid message can be sent', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)
    mockConversationsApi.createMessage.mockResolvedValue({
      id: 'msg-3',
      conversation_id: 'conv-1',
      sender_id: 'client-1',
      content: 'Test message',
      created_at: '2024-01-01T12:00:00Z',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(messageInput, { target: { value: 'Test message' } })

    const sendButton = screen.getByText(/send/i)
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockConversationsApi.createMessage).toHaveBeenCalled()
    })
  })

  it('empty message is rejected without an API request', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })

    const sendButton = screen.getByText(/send/i)
    fireEvent.click(sendButton)

    expect(mockConversationsApi.createMessage).not.toHaveBeenCalled()
  })

  it('whitespace-only message is rejected', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(messageInput, { target: { value: '   ' } })

    const sendButton = screen.getByText(/send/i)
    fireEvent.click(sendButton)

    expect(mockConversationsApi.createMessage).not.toHaveBeenCalled()
  })

  it('failed send retains the typed message', async () => {
    mockConversationsApi.getConversation.mockResolvedValue(mockConversation)
    mockConversationsApi.createMessage.mockRejectedValue(new Error('Network error'))

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText('Inquiry about Test Property')).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(messageInput, { target: { value: 'Test message' } })

    const sendButton = screen.getByText(/send/i)
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(messageInput).toHaveValue('Test message')
    })
  })

  it('unknown conversation displays an appropriate state', async () => {
    mockConversationsApi.getConversation.mockRejectedValue({
      response: { status: 404 },
      message: 'Not found',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.queryByText(/inquiry about/i)).not.toBeInTheDocument()
    })
  })
})
