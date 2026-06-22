import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminProperties from '../AdminProperties'
import { adminPropertiesApi } from '../../../lib/adminPropertiesApi'

vi.mock('../../../lib/adminPropertiesApi')

describe('AdminProperties', () => {
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
          <AdminProperties />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  const mockProperties = [
    {
      id: 'prop-1',
      reference_code: 'REF001',
      title: 'Test Property',
      description: 'Test description',
      property_type: 'apartment',
      listing_type: 'sale',
      status: 'available',
      price: 200000,
      area: 100,
      bedrooms: 2,
      bathrooms: 1,
      is_furnished: false,
      is_featured: true,
      city: 'Tunis',
      district: 'Lac 2',
      governorate: 'Tunis',
      latitude: 36.8,
      longitude: 10.2,
      agent_id: 'agent-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      agent: {
        id: 'agent-1',
        user_id: 'user-1',
        office: 'Tunis',
        phone: '+21612345678',
        user: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
      images: [],
      features: [],
    },
  ]

  it('renders loading state', () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays properties list on successful load', async () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockResolvedValue(mockProperties)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Property Administration')).toBeInTheDocument()
    })
  })

  it('displays property title in table', async () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockResolvedValue(mockProperties)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument()
    })
  })

  it('displays filters section', async () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockResolvedValue(mockProperties)
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toBeInTheDocument()
      expect(screen.getByLabelText('Property Type')).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument()
    })
  })

  it('displays empty state when no properties found', async () => {
    vi.mocked(adminPropertiesApi.getAllProperties).mockResolvedValue([])
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.getByText(/No properties found matching the current filters/)).toBeInTheDocument()
    })
  })
})
