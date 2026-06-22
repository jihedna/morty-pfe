import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AgentProperties from '../AgentProperties'
import { agentPropertiesApi } from '../../../lib/agentPropertiesApi'

vi.mock('../../../lib/agentPropertiesApi')

describe('AgentProperties', () => {
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
          <AgentProperties />
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
    vi.mocked(agentPropertiesApi.listMyProperties).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    expect(screen.getByText(/loading properties/i)).toBeInTheDocument()
  })

  it('displays property list on successful load', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([mockProperty])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my properties/i })).toBeInTheDocument()
    })
  })

  it('add property button navigates to property creation', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([mockProperty])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add property/i })).toBeInTheDocument()
    })
  })

  it('empty state displays when no properties found', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(/no properties found/i)).toBeInTheDocument()
    })
  })

  it('error message displays on failed load', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockRejectedValue(new Error('Load failed'))
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/load failed/i)
    })
  })

  it('property table displays property data', async () => {
    vi.mocked(agentPropertiesApi.listMyProperties).mockResolvedValue([mockProperty])
    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument()
    })
  })
})
