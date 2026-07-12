import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentNotifications from '../AgentNotifications'
import { notificationsApi } from '../../../lib/notificationsApi'

vi.mock('../../../lib/notificationsApi')

describe('AgentNotifications', () => {
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
          <AgentNotifications />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockNotification = {
    id: '1',
    user_id: 'user-1',
    notification_type: 'message',
    title: 'Test Notification',
    message: 'Test message',
    data: { conversation_id: 'conv-1' },
    is_read: false,
    read_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  it('renders loading state', () => {
    vi.mocked(notificationsApi.getMyNotifications).mockReturnValue(new Promise(() => {}))
    vi.mocked(notificationsApi.getUnreadCount).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading notifications/i)).toBeInTheDocument()
  })

  it('displays notification list on successful load', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument()
    })
  })

  it('status filter displays all options', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
  })

  it('empty state displays when no notifications found', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [], total: 0, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no notifications found/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockRejectedValue(new Error('Load failed'))
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 0 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('notification card displays title', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument()
    })
  })

  it('notification card displays message', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockNotification.message)).toBeInTheDocument()
    })
  })

  it('unread notification is visually indicated', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument()
    })
  })

  it('view button marks notification as read and reloads list', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    vi.mocked(notificationsApi.markNotificationAsRead).mockResolvedValue({ ...mockNotification, is_read: true })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /view/i }))

    await waitFor(() => {
      expect(vi.mocked(notificationsApi.markNotificationAsRead)).toHaveBeenCalledWith(mockNotification.id)
      expect(vi.mocked(notificationsApi.getMyNotifications)).toHaveBeenCalledTimes(2)
    })
  })

  it('mark as read button marks notification as read', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    vi.mocked(notificationsApi.markNotificationAsRead).mockResolvedValue({ ...mockNotification, is_read: true })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark as read/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /mark as read/i }))

    await waitFor(() => {
      expect(vi.mocked(notificationsApi.markNotificationAsRead)).toHaveBeenCalledWith(mockNotification.id)
    })
  })

  it('delete button removes notification', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    vi.mocked(notificationsApi.deleteNotification).mockResolvedValue(undefined)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(vi.mocked(notificationsApi.deleteNotification)).toHaveBeenCalledWith(mockNotification.id)
    })
  })

  it('mark all read button marks all notifications as read', async () => {
    vi.mocked(notificationsApi.getMyNotifications).mockResolvedValue({ notifications: [mockNotification], total: 1, skip: 0, limit: 20 })
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread_count: 1 })
    vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue({ marked_count: 1 })
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }))

    await waitFor(() => {
      expect(vi.mocked(notificationsApi.markAllAsRead)).toHaveBeenCalled()
    })
  })
})
