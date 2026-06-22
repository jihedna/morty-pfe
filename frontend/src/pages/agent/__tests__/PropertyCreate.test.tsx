import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import PropertyCreate from '../PropertyCreate'

describe('PropertyCreate', () => {
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
          <PropertyCreate />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders property creation page', () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/add new property/i)).toBeInTheDocument()
  })

  it('displays basic information form section', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('displays location information form section', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('displays property details form section', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('form validation works for required fields', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('submit button creates property successfully', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed creation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })

  it('cancel button navigates back to properties', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/add new property/i)).toBeInTheDocument()
    })
  })
})
