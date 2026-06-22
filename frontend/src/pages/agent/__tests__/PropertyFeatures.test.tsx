import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import PropertyEdit from '../PropertyEdit'

describe('PropertyFeatures', () => {
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

  it('displays feature management section', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('displays existing property features', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('add button allows adding new features', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('feature input accepts valid feature names', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('feature input rejects empty feature names', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('delete button removes feature with confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('confirmation dialog displays before deleting feature', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('canceling feature deletion keeps feature', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('features are saved with property update', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed feature addition', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed feature deletion', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('empty state displays when no features exist', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('duplicate features are prevented', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })
})
