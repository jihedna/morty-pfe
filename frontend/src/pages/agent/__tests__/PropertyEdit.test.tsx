import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import PropertyEdit from '../PropertyEdit'
import { agentPropertiesApi } from '../../../lib/agentPropertiesApi'

vi.mock('../../../lib/agentPropertiesApi')

describe('PropertyEdit', () => {
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

  const mockProperty = {
    id: '1',
    reference_code: 'REF001',
    title: 'Test Property',
    description: 'Test description',
    property_type: 'apartment',
    listing_type: 'sale',
    status: 'available',
    price: 100000,
    currency: 'TND',
    area_sqm: 100,
    land_area_sqm: null,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor_number: 1,
    total_floors: 5,
    construction_year: null,
    is_furnished: false,
    is_featured: false,
    address_line: '123 Test St',
    city: 'Tunis',
    district: 'Centre',
    governorate: 'Tunis',
    postal_code: '1001',
    latitude: null,
    longitude: null,
    published_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    agent_id: 'agent-1',
    images: [],
    features: [],
  }

  it('renders loading state', () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading property/i)).toBeInTheDocument()
  })

  it('displays property form with existing data on successful load', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockResolvedValue(mockProperty)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit property/i })).toBeInTheDocument()
    })
  })

  it('displays basic information form section', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockResolvedValue(mockProperty)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })
  })

  it('displays location information form section', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockResolvedValue(mockProperty)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /location/i })).toBeInTheDocument()
    })
  })

  it('displays property details form section', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockResolvedValue(mockProperty)
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /listing information/i })).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('403 error displays access denied message', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockRejectedValue(new Error('403 Forbidden'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/403/i)
    })
  })

  it('404 error displays property not found message', async () => {
    vi.mocked(agentPropertiesApi.getMyProperty).mockRejectedValue(new Error('404 Not Found'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/404/i)
    })
  })
})
