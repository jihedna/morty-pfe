import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import LandingPage from '../LandingPage'

const mockNavigate = vi.fn()

vi.mock('../../lib/propertyApi', () => ({
  propertyApi: {
    listProperties: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { propertyApi } from '../../lib/propertyApi'
import { PropertyType, ListingType, PropertyStatus, Currency } from '../../types/property'

const mockProperty = (id: string, title: string, index: number) => ({
  id,
  title,
  description: 'description',
  property_type: PropertyType.APARTMENT,
  listing_type: ListingType.SALE,
  status: PropertyStatus.AVAILABLE,
  price: 300000 + index * 100000,
  currency: Currency.TND,
  area_sqm: 120 + index * 20,
  land_area_sqm: null,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 2,
  floor_number: 1,
  total_floors: 3,
  construction_year: null,
  is_furnished: false,
  is_featured: false,
  address_line: null,
  city: 'Tunis',
  district: null,
  governorate: null,
  postal_code: null,
  latitude: null,
  longitude: null,
  published_at: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
  agent_id: 'agent-1',
  reference_code: `REF-${id}`,
  images: index === 0 ? [{ id: 'img-1', property_id: id, image_url: 'https://example.com/img.jpg', alt_text: null, position: 0, is_primary: true, created_at: '', updated_at: '' }] : [],
  features: [],
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  )

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
    mockNavigate.mockReset()
    vi.mocked(propertyApi.listProperties).mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 3,
    })
  })

  it('renders major Stitch sections', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    expect(screen.getByRole('heading', { name: /Find Your Next Property in Tunisia/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Search Properties/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Join as Agent/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /List Your Property/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Start Searching/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Featured Listings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Your AI Real Estate Assistant/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Find the Right Agent for You/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders navigation links with valid routes and toggles mobile menu', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    const getNavLink = (name: RegExp) =>
      screen.getAllByRole('link', { name }).find(link => link.closest('nav'))

    expect(getNavLink(/Buy/i)).toHaveAttribute('href', '/properties?listing_type=sale')
    expect(getNavLink(/Rent/i)).toHaveAttribute('href', '/properties?listing_type=rent')
    expect(getNavLink(/Commercial/i)).toHaveAttribute('href', '/properties?property_type=commercial')
    expect(getNavLink(/Sign In/i)).toHaveAttribute('href', '/login')
    expect(getNavLink(/Join as Agent/i)).toHaveAttribute('href', '/register')

    const toggle = screen.getByRole('button', { name: /Toggle navigation menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('mobile-nav-menu')).toBeInTheDocument()
  })

  it('hero search switches tabs and navigates with query params', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    const rentTab = screen.getByRole('button', { name: 'Rent' })
    fireEvent.click(rentTab)
    expect(rentTab).toHaveAttribute('aria-pressed', 'true')

    const input = screen.getByLabelText(/Search by neighborhood/i)
    fireEvent.change(input, { target: { value: 'Tunis' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(mockNavigate).toHaveBeenCalledWith('/properties?listing_type=rent&search=Tunis')
  })

  it('loads featured properties from the API', async () => {
    vi.mocked(propertyApi.listProperties).mockResolvedValue({
      properties: [
        mockProperty('p1', 'Sunny Apartment', 0),
        mockProperty('p2', 'Modern Villa', 1),
        mockProperty('p3', 'City Studio', 2),
      ],
      total: 3,
      skip: 0,
      limit: 3,
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Sunny Apartment')).toBeInTheDocument()
    })
    expect(screen.getByText('Modern Villa')).toBeInTheDocument()
    expect(screen.getByText('City Studio')).toBeInTheDocument()
  })

  it('shows loading and error states for featured properties', async () => {
    vi.mocked(propertyApi.listProperties).mockRejectedValue(new Error('Network error'))

    renderPage()

    expect(screen.getByText(/Loading featured properties/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Network error/i)
    })
  })

  it('shows empty state when no featured properties are available', async () => {
    vi.mocked(propertyApi.listProperties).mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 3,
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/No properties available yet/i)).toBeInTheDocument()
    })
  })

  it('AI assistant dispatches open-chatbot event when signed in', async () => {
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', email: 'test@example.com', role: 'client' }))

    const dispatch = vi.spyOn(window, 'dispatchEvent')
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    const openButton = screen.getByRole('button', { name: /Open AI Assistant/i })
    fireEvent.click(openButton)

    expect(dispatch).toHaveBeenCalled()
    dispatch.mockRestore()
  })

  it('footer has valid links and no href="#" anchors', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link.getAttribute('href')).not.toBe('#')
    })

    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} RE/MAX Smile AI`))).toBeInTheDocument()
  })

  it('does not show placeholder or sample data text', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Loading featured properties/i)).not.toBeInTheDocument())

    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/demonstration purposes/i)).not.toBeInTheDocument()
  })
})
