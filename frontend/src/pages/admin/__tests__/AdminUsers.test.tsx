import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminUsers from '../AdminUsers'

vi.mock('../../../lib/adminUsersApi', () => ({
  adminUsersApi: {
    listUsers: vi.fn().mockResolvedValue({ users: [], total: 0, skip: 0, limit: 20 }),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  },
}))

describe('AdminUsers', () => {
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
          <AdminUsers />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders the page heading', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })
  })

  it('renders the role filter dropdown', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })
    await waitFor(() => {
      expect(screen.getByLabelText('Role')).toBeInTheDocument()
    })
  })

  it('renders the refresh button', async () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })
  })
})
