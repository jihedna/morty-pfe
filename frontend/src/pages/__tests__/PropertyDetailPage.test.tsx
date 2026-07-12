import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyDetailPage from '../PropertyDetailPage'
import { propertyApi } from '../../lib/propertyApi'
import { PropertyPublicResponse } from '../../types/property'
import { FavoriteCheckResponse } from '../../types/favorite'

// Mock the propertyApi
vi.mock('../../lib/propertyApi')

const renderPage = (route = '/properties/1') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

describe('PropertyDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(propertyApi.checkFavorite).mockResolvedValue({ property_id: '1', is_favorited: false } as FavoriteCheckResponse)
  })

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
  } as unknown as PropertyPublicResponse

  it('loads property from the backend', async () => {
    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Test Property' })).toBeInTheDocument()
    expect(vi.mocked(propertyApi.getProperty)).toHaveBeenCalledWith('1')
  })

  it('shows public sign-in CTA when not authenticated', async () => {
    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)

    renderPage()

    expect(await screen.findByText(/Unlock full access/i)).toBeInTheDocument()
    expect(screen.queryByText(/Contact Agent/i)).not.toBeInTheDocument()
  })

  it('displays loading state', () => {
    vi.mocked(propertyApi.getProperty).mockImplementation(() => new Promise(() => {}))
    vi.mocked(propertyApi.checkFavorite).mockImplementation(() => new Promise(() => {}))

    const { container } = renderPage()

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('displays 404 error when property not found', async () => {
    vi.mocked(propertyApi.getProperty).mockRejectedValue(new Error('Not found'))

    renderPage()

    expect(await screen.findByText('Not found')).toBeInTheDocument()
    expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
  })

  it('shows contact and viewing buttons for clients', async () => {
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'client-1', role: 'client' }))

    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Test Property' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Contact Agent/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Request Viewing/i })).toBeInTheDocument()
  })
})
