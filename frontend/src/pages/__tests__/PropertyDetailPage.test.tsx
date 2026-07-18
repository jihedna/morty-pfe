import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyDetailPage from '../PropertyDetailPage'
import { propertyApi } from '../../lib/propertyApi'
import { adminAgentsApi } from '../../lib/adminAgentsApi'
import { PropertyPublicResponse } from '../../types/property'
import { FavoriteCheckResponse } from '../../types/favorite'

// Mock the APIs
vi.mock('../../lib/propertyApi')
vi.mock('../../lib/adminAgentsApi')

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

const waitForAsyncComponents = async () => {
  await waitFor(() => expect(screen.queryByTestId('similar-properties-loading')).not.toBeInTheDocument())
  await waitFor(() => expect(screen.queryByTestId('similar-properties-error')).not.toBeInTheDocument())
  await waitFor(() => expect(screen.getByText('Agent One')).toBeInTheDocument())
}

describe('PropertyDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(propertyApi.checkFavorite).mockResolvedValue({ property_id: '1', is_favorited: false } as FavoriteCheckResponse)
    vi.mocked(propertyApi.listProperties).mockResolvedValue({ properties: [], total: 0, skip: 0, limit: 0 })
    vi.mocked(adminAgentsApi.getAgent).mockResolvedValue({
      id: 'agent-1',
      office: 'RE/MAX Smile',
      phone: '+216 00 000 000',
      biography: null,
      years_experience: 5,
      availability_status: 'available',
      languages: null,
      minimum_budget: 0,
      maximum_budget: 0,
      active_lead_count: 0,
      success_rate: 0,
      closed_deals: 0,
      user: { id: 'user-1', first_name: 'Agent', last_name: 'One', email: 'agent@example.com' },
      territories: [],
      property_types: [],
    })
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
    await waitForAsyncComponents()
    expect(vi.mocked(propertyApi.getProperty)).toHaveBeenCalledWith('1')
  })

  it('shows public sign-in CTA when not authenticated', async () => {
    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)

    renderPage()

    expect(await screen.findByText(/Unlock full access/i)).toBeInTheDocument()
    await waitForAsyncComponents()
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
    await waitForAsyncComponents()
    expect(screen.getByRole('button', { name: /Contact Agent/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Request Viewing/i })).toBeInTheDocument()
  })

  it('renders the gallery when images are present', async () => {
    const propertyWithImages = {
      ...mockProperty,
      images: [
        { id: 'img-1', property_id: '1', image_url: 'https://example.com/1.jpg', alt_text: 'Front', position: 0, is_primary: true, created_at: '', updated_at: '' },
        { id: 'img-2', property_id: '1', image_url: 'https://example.com/2.jpg', alt_text: 'Living', position: 1, is_primary: false, created_at: '', updated_at: '' },
      ],
    }
    vi.mocked(propertyApi.getProperty).mockResolvedValue(propertyWithImages)

    renderPage()

    await waitFor(() => {
      expect(screen.getByAltText('Front')).toBeInTheDocument()
    })
    await waitForAsyncComponents()
    expect(screen.getByAltText('Living')).toBeInTheDocument()
  })

  it('renders the location map when coordinates are present', async () => {
    const propertyWithLocation = {
      ...mockProperty,
      latitude: 36.8065,
      longitude: 10.1815,
    }
    vi.mocked(propertyApi.getProperty).mockResolvedValue(propertyWithLocation)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /Map location for Test Property/i })).toBeInTheDocument()
    })
    await waitForAsyncComponents()
  })

  it('shares the property using the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, writable: true, configurable: true })
    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Property' })).toBeInTheDocument()
    })
    await waitForAsyncComponents()

    fireEvent.click(screen.getAllByLabelText(/Share property/i)[0])
    await waitFor(() => expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test Property' })))
  })

  it('toggles favorite for clients', async () => {
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'client-1', role: 'client' }))

    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)
    vi.mocked(propertyApi.checkFavorite).mockResolvedValue({ property_id: '1', is_favorited: false } as FavoriteCheckResponse)
    vi.mocked(propertyApi.addFavorite).mockResolvedValue({ id: 'fav-1', user_id: 'client-1', property_id: '1', property: mockProperty, favorited_at: '' } as unknown as import('../../types/favorite').FavoriteResponse)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Property' })).toBeInTheDocument()
    })
    await waitForAsyncComponents()

    const favoriteButtons = screen.getAllByRole('button', { name: /Add to favorites/i })
    const favoriteButton = favoriteButtons.find(b => !b.hasAttribute('disabled')) || favoriteButtons[0]
    fireEvent.click(favoriteButton)

    await waitFor(() => expect(vi.mocked(propertyApi.addFavorite)).toHaveBeenCalledWith('1'))
  })

  it('loads and displays similar properties', async () => {
    const similarProperty = {
      ...mockProperty,
      id: '2',
      reference_code: 'REF002',
      title: 'Similar Property',
    }
    vi.mocked(propertyApi.getProperty).mockResolvedValue(mockProperty)
    vi.mocked(propertyApi.listProperties).mockResolvedValue({
      properties: [similarProperty],
      total: 1,
      skip: 0,
      limit: 5,
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Similar Property')).toBeInTheDocument()
    })
    await waitForAsyncComponents()
    expect(vi.mocked(propertyApi.listProperties)).toHaveBeenCalledWith(expect.objectContaining({ city: 'Tunis', listing_type: 'sale', property_type: 'apartment' }))
  })
})
