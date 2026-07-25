import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyListPage from '../PropertyListPage'
import { propertyApi } from '../../lib/propertyApi'

// Mock the property API. The map now has its own dedicated page.
vi.mock('../../lib/propertyApi', () => ({
  propertyApi: {
    listProperties: vi.fn(),
    listPropertiesForMap: vi.fn(),
    checkFavorite: vi.fn().mockResolvedValue({ is_favorited: false }),
    addFavorite: vi.fn().mockResolvedValue(undefined),
    removeFavorite: vi.fn().mockResolvedValue(undefined),
    getPropertySearchPosition: vi.fn(),
  },
}))

vi.mock('../../components/property/search/PropertySearchMap', () => ({
  PropertySearchMap: ({ properties, selectedPropertyId, onPropertySelect }: {
    properties: Array<{ id: string; title: string }>
    selectedPropertyId: string | null
    onPropertySelect: (id: string) => void
  }) => createElement('div', {
    'data-testid': 'property-search-map',
    'data-selected-property-id': selectedPropertyId ?? '',
  }, properties.map(property => createElement('button', {
    key: String(property.id),
    'data-testid': `map-select-${property.id}`,
    'aria-label': `Select marker ${property.id}`,
    onClick: () => onPropertySelect(String(property.id)),
  }, 'Select marker'))),
}))

const mockPropertyApi = propertyApi as unknown as {
  listProperties: ReturnType<typeof vi.fn>
  listPropertiesForMap: ReturnType<typeof vi.fn>
  checkFavorite: ReturnType<typeof vi.fn>
  addFavorite: ReturnType<typeof vi.fn>
  removeFavorite: ReturnType<typeof vi.fn>
  getPropertySearchPosition: ReturnType<typeof vi.fn>
}

function buildProperties(count: number, withCoords = false) {
  return Array.from({ length: count }).map((_, i) => ({
    id: String(i + 1),
    reference_code: `REF00${i + 1}`,
    title: `Property ${i + 1}`,
    description: null,
    property_type: 'apartment' as const,
    listing_type: 'sale' as const,
    status: 'available' as const,
    price: 100000 + i * 10000,
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
    district: 'Lac',
    governorate: null,
    postal_code: null,
    latitude: withCoords ? 36.8 + i * 0.01 : null,
    longitude: withCoords ? 10.18 + i * 0.01 : null,
    published_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    agent_id: 'agent-1',
    images: [],
    features: [],
  }))
}

interface MockResponse {
  type: 'resolved' | 'rejected' | 'pending'
  value?: unknown
}

function renderPage(
  initialSearch = '',
  total = 1,
  withCoords = false,
  mockResponse: MockResponse = { type: 'resolved' }
) {
  if (mockResponse.type === 'rejected') {
    mockPropertyApi.listProperties.mockRejectedValue(
      mockResponse.value ?? new Error('Server error')
    )
    mockPropertyApi.listPropertiesForMap.mockRejectedValue(
      mockResponse.value ?? new Error('Server error')
    )
  } else if (mockResponse.type === 'pending') {
    mockPropertyApi.listProperties.mockImplementation(() => new Promise(() => {}))
    mockPropertyApi.listPropertiesForMap.mockImplementation(() => new Promise(() => {}))
  } else {
    const properties = mockResponse.value ?? buildProperties(total, withCoords)
    mockPropertyApi.listProperties.mockResolvedValue({
      properties,
      total: Array.isArray(properties) ? properties.length : total,
      skip: 0,
      limit: 20,
    })
    mockPropertyApi.listPropertiesForMap.mockResolvedValue(properties)
  }

  return render(
    <MemoryRouter initialEntries={[`/properties${initialSearch}`]}>
      <AuthProvider>
        <PropertyListPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

function getLastFilters() {
  return mockPropertyApi.listProperties.mock.calls[mockPropertyApi.listProperties.mock.calls.length - 1][0]
}

describe('PropertyListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPropertyApi.checkFavorite.mockResolvedValue({ is_favorited: false })
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('loads and displays properties from the backend', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    const { container } = renderPage('', 1, false, { type: 'pending' })

    expect(screen.getByText('Loading properties...')).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('displays empty state when no properties', async () => {
    renderPage('', 0)

    await waitFor(() => {
      expect(screen.getByText('No properties found')).toBeInTheDocument()
    })
  })

  it('displays server error with retry', async () => {
    renderPage('', 1, false, { type: 'rejected', value: new Error('Server error') })

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getAllByText('Server error').length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })
  })

  it('parses valid URL params and ignores invalid values', async () => {
    renderPage('?search=Tunis&property_type=invalid&page=2&sort_by=price&sort_direction=asc')

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters).toMatchObject({
        search: 'Tunis',
        skip: 20,
        limit: 20,
        sort_by: 'price',
        sort_direction: 'asc',
      })
      expect(filters.property_type).toBeUndefined()
    })
  })

  it('filters as the user types and resets page to 1', async () => {
    renderPage('?page=2', 50)

    await waitFor(() => {
      expect(getLastFilters().skip).toBe(20)
    })

    const searchInput = screen.getByLabelText('Search properties')
    fireEvent.change(searchInput, { target: { value: 'S' } })

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters.search).toBe('S')
      expect(filters.skip).toBe(0)
    })

    fireEvent.change(searchInput, { target: { value: 'Sidi' } })

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters.search).toBe('Sidi')
      expect(filters.skip).toBe(0)
    })
  })

  it('applies toolbar filters and sends them to the backend', async () => {
    renderPage()

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenCalled()
    })

    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '200000' } })
    fireEvent.change(screen.getByLabelText('Property type'), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText('Minimum bedrooms'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Minimum bathrooms'), { target: { value: '2' } })

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters.minimum_price).toBe(100000)
      expect(filters.maximum_price).toBe(200000)
      expect(filters.property_type).toBe('house')
      expect(filters.minimum_bedrooms).toBe(2)
      expect(filters.minimum_bathrooms).toBe(2)
      expect(filters.skip).toBe(0)
    })
  })

  it('opens More Filters dialog, applies filters, resets page to 1', async () => {
    renderPage('?page=2', 50)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'More Filters' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'More Filters' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'More Filters' })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Lac' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Tunis' } })
    fireEvent.change(screen.getByLabelText('Featured Only'), { target: { value: 'true' } })

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters.district).toBe('Lac')
      expect(filters.city).toBe('Tunis')
      expect(filters.is_featured).toBe(true)
      expect(filters.skip).toBe(0)
    })
  })

  it('changes sort and resets page to 1', async () => {
    renderPage('?page=2', 50)

    await waitFor(() => {
      expect(screen.getByLabelText('Sort results')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Sort results'), { target: { value: 'price:asc' } })

    await waitFor(() => {
      const filters = getLastFilters()
      expect(filters.sort_by).toBe('price')
      expect(filters.sort_direction).toBe('asc')
      expect(filters.skip).toBe(0)
    })
  })

  it('pagination requests the correct page and converts to skip', async () => {
    renderPage('', 50)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => {
      expect(getLastFilters().skip).toBe(20)
    })
  })

  it('clamps out of range page to last valid page', async () => {
    renderPage('?page=10', 25)

    await waitFor(() => {
      expect(getLastFilters().skip).toBe(20)
    })
  })

  it('renders properties with coordinates in the list', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Property 2')).toBeInTheDocument()
    expect(screen.getByTestId('property-search-map')).toBeInTheDocument()
  })

  it('requests map data using the same filters without pagination', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })

    expect(mockPropertyApi.listPropertiesForMap).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'created_at', sort_direction: 'desc' })
    )
  })

  it('selects and scrolls the exact current-page card from a marker', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('map-select-2'))

    await waitFor(() => {
      expect(screen.getByTestId('property-search-map')).toHaveAttribute('data-selected-property-id', '2')
    })
    const selectedLink = screen.getByText('Property 2').closest('a')
    expect(selectedLink).toHaveClass('ring-2')
    expect(screen.getByText('Property 1').closest('a')).not.toHaveClass('ring-2')
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(mockPropertyApi.getPropertySearchPosition).not.toHaveBeenCalled()
  })

  it('loads the located page and selects only the exact off-page UUID', async () => {
    const current = [buildProperties(1)[0], { ...buildProperties(2)[1], id: 'property-e', title: 'Property E' }]
    current[0] = { ...current[0], id: 'property-c', title: 'Property C' }
    const destination = [
      { ...buildProperties(1)[0], id: 'property-d', title: 'Property D' },
      { ...buildProperties(1)[0], id: 'property-a', title: 'Property A' },
    ]
    const mapPoints = [
      ...current,
      ...destination,
    ]
    mockPropertyApi.listPropertiesForMap.mockResolvedValue(mapPoints)
    mockPropertyApi.getPropertySearchPosition.mockResolvedValue({
      property_id: 'property-a', matched: true, position: 61, page: 4,
    })
    mockPropertyApi.listProperties.mockImplementation((filters) => Promise.resolve({
      properties: filters.skip === 60 ? destination : current,
      total: 80,
      skip: filters.skip ?? 0,
      limit: 20,
    }))

    render(
      <MemoryRouter initialEntries={['/properties']}>
        <AuthProvider><PropertyListPage /></AuthProvider>
      </MemoryRouter>
    )

    await screen.findByTestId('map-select-property-a')
    fireEvent.click(screen.getByTestId('map-select-property-a'))

    await waitFor(() => expect(screen.getByText('Property A').closest('a')).toHaveClass('ring-2'))
    expect(screen.getByText('Property D').closest('a')).not.toHaveClass('ring-2')
    expect(screen.queryByText(/Selected from map/i)).not.toBeInTheDocument()
    expect(mockPropertyApi.getPropertySearchPosition).toHaveBeenCalledWith(
      'property-a', expect.any(Object), 20
    )
  })

  it('does not show placeholder text', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument()
    })
  })
})
