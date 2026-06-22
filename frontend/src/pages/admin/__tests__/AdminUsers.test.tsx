import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminUsers from '../AdminUsers'

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

  it('displays unavailable state message', () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText('User Administration')).toBeInTheDocument()
    expect(screen.getByText('Backend Capability Missing')).toBeInTheDocument()
  })

  it('displays required backend endpoints list', () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/List users with pagination and filters/)).toBeInTheDocument()
    expect(screen.getByText(/Create user/)).toBeInTheDocument()
  })

  it('displays placeholder message for future implementation', () => {
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/This page will be implemented once the backend provides user administration endpoints/)).toBeInTheDocument()
  })
})
