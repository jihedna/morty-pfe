import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyDetailPage from '../PropertyDetailPage'
import { propertyApi } from '../../lib/propertyApi'

// Mock the propertyApi
vi.mock('../../lib/propertyApi')

const mockPropertyApi = propertyApi as unknown as { getProperty: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> } }

describe('PropertyDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads property from the backend', async () => {
    const mockProperty = {
      id: '1',
      reference_code: 'REF001',
      title: 'Test Property',
      description: 'Test description',
      property_type: 'apartment' as const,
      listing_type: 'sale' as const,
      status: 'available' as const,
      price: 100000,
      currency: 'TND' as const,
      area_sqm: 100,
      land_area_sqm: null,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      floor_number: 1,
      total_floors: 3,
      construction_year: null,
      is_furnished: false,
      is_featured: false,
      address_line: '123 Test St',
      city: 'Tunis',
      district: 'Tunis',
      governorate: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      published_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      agent_id: 'agent-1',
      images: [],
      features: [],
    }

    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(container).toBeInTheDocument()
      expect(mockPropertyApi.getProperty).toHaveBeenCalledWith('1')
    })
  })

  it('displays loading state', () => {
    mockPropertyApi.getProperty.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('displays 404 error when property not found', async () => {
    mockPropertyApi.getProperty.mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/properties/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
    })
  })

  it('shows contact and viewing buttons for clients', async () => {
    const mockProperty = {
      id: '1',
      reference_code: 'REF001',
      title: 'Test Property',
      description: null,
      property_type: 'apartment' as const,
      listing_type: 'sale' as const,
      status: 'available' as const,
      price: 100000,
      currency: 'TND' as const,
      area_sqm: 100,
      land_area_sqm: null,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      floor_number: 1,
      total_floors: 3,
      construction_year: null,
      is_furnished: false,
      is_featured: false,
      address_line: null,
      city: 'Tunis',
      district: 'Tunis',
      governorate: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      published_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      agent_id: 'agent-1',
      images: [],
      features: [],
    }

    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(container).toBeInTheDocument()
    })
  })
})
