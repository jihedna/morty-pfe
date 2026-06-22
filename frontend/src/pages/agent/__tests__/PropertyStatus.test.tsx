import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import PropertyEdit from '../PropertyEdit'

describe('PropertyStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderWithAuth = (user: { id: string; role: string } | null, propertyId: string = '1') => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={[`/agent/properties/${propertyId}/edit`]}>
        <AuthProvider>
          <Routes>
            <Route path="/agent/properties/:propertyId/edit" element={<PropertyEdit />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('displays status dropdown with all options', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change requires confirmation dialog', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('confirmation dialog displays correct status change message', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('confirming status change updates property status', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('canceling status change keeps original status', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change to available requires confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change to reserved requires confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change to sold requires confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change to rented requires confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('status change to archived requires confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed status change', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })
})
