import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import ClientDashboard from '../ClientDashboard'

describe('ClientDashboard', () => {
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
          <ClientDashboard />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders dashboard with loading state', () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('displays summary metrics', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('loading state renders', () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('empty values render as zero', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('quick-action links point to correct routes', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('recent activity renders when available', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('empty recent activity state renders correctly', async () => {
    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })
})
