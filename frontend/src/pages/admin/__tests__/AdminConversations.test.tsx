import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminConversations from '../AdminConversations'
import { adminConversationsApi } from '../../../lib/adminConversationsApi'

vi.mock('../../../lib/adminConversationsApi')

describe('AdminConversations', () => {
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
          <AdminConversations />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockConversations = [
    {
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
    },
  ]

  it('renders loading state', () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays conversations list on successful load', async () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockResolvedValue(mockConversations)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Conversation Administration')).toBeInTheDocument()
    })
  })

  it('displays conversation subject in table', async () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockResolvedValue(mockConversations)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })
  })

  it('displays filters section', async () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockResolvedValue(mockConversations)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('displays empty state when no conversations found', async () => {
    vi.mocked(adminConversationsApi.getAllConversations).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/No conversations found matching the current filters/)).toBeInTheDocument()
    })
  })
})
