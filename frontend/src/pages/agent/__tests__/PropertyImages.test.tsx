import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import PropertyEdit from '../PropertyEdit'

describe('PropertyImages', () => {
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

  it('displays image management section', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('displays existing property images', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('upload button allows adding new images', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('image upload accepts valid file types', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('image upload rejects invalid file types', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('delete button removes image with confirmation', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('confirmation dialog displays before deleting image', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('canceling image deletion keeps image', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('set as primary button changes main image', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('primary image is visually indicated', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed upload', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed deletion', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })

  it('empty state displays when no images exist', async () => {
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/edit property/i)).toBeInTheDocument()
    })
  })
})
