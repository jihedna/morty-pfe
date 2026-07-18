import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyListPage from '../PropertyListPage'
import { propertyApi } from '../../lib/propertyApi'

// Mock the propertyApi and property search map
vi.mock('../../lib/propertyApi', () => ({
  propertyApi: {
    listProperties: vi.fn(),
    listPropertiesForMap: vi.fn(),
    checkFavorite: vi.fn().mockResolvedValue({ is_favorited: false }),
    addFavorite: vi.fn().mockResolvedValue(undefined),
    removeFavorite: vi.fn().mockResolvedValue(undefined),
  },
}))

interface MockMapProperty {
  id: string
  title: string
}

interface MockMapProps {
  properties: MockMapProperty[]
  hoveredPropertyId: string | null
  selectedPropertyId: string | null
  onPropertySelect: (propertyId: string) => void
  onPropertyHover: (propertyId: string | null) => void
}

vi.mock('../../components/property/search/PropertySearchMap', () => ({
  PropertySearchMap: (props: MockMapProps) =>
    createElement('div', {
      'data-testid': 'property-search-map',
      'data-hovered-property-id': props.hoveredPropertyId ?? '',
      'data-selected-property-id': props.selectedPropertyId ?? '',
    }, [
      ...props.properties.map((p: MockMapProperty) =>
        createElement('button', {
          key: p.id,
          'data-testid': `map-select-${p.id}`,
          'aria-label': `Select ${p.title} on map`,
          onClick: () => props.onPropertySelect(p.id),
        }, 'Select')
      ),
      createElement('button', {
        key: 'hover',
        'data-testid': 'map-hover',
        'aria-label': 'Hover first property',
        onMouseEnter: () => props.onPropertyHover(props.properties[0]?.id ?? null),
        onMouseLeave: () => props.onPropertyHover(null),
      }, 'Hover'),
    ]),
}))

const mockPropertyApi = propertyApi as unknown as {
  listProperties: ReturnType<typeof vi.fn>
  listPropertiesForMap: ReturnType<typeof vi.fn>
  checkFavorite: ReturnType<typeof vi.fn>
  addFavorite: ReturnType<typeof vi.fn>
  removeFavorite: ReturnType<typeof vi.fn>
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
      expect(screen.getByText('Server error')).toBeInTheDocument()
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

  it('applies search and resets page to 1', async () => {
    renderPage('?page=2', 50)

    await waitFor(() => {
      expect(getLastFilters().skip).toBe(20)
    })

    const searchInput = screen.getByLabelText('Search properties')
    fireEvent.change(searchInput, { target: { value: 'Sidi' } })
    fireEvent.submit(searchInput.closest('form') as HTMLFormElement)

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

  it('syncs list hover with map and map hover with list', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })

    const map = screen.getByTestId('property-search-map')
    expect(map).toHaveAttribute('data-hovered-property-id', '')

    fireEvent.mouseEnter(screen.getByText('Property 1'))

    await waitFor(() => {
      expect(map).toHaveAttribute('data-hovered-property-id', '1')
    })

    fireEvent.mouseEnter(screen.getByText('Property 2'))

    await waitFor(() => {
      expect(map).toHaveAttribute('data-hovered-property-id', '2')
    })

    fireEvent.mouseLeave(screen.getByText('Property 2'))

    await waitFor(() => {
      expect(map).toHaveAttribute('data-hovered-property-id', '')
    })
  })

  it('syncs map selection with list card highlight', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('map-select-1'))

    await waitFor(() => {
      const link = screen.getByText('Property 1').closest('a')
      expect(link).toHaveClass('ring-2')
    })

    expect(screen.getByTestId('property-search-map')).toHaveAttribute('data-selected-property-id', '1')
  })

  it('toggles mobile list/map view', async () => {
    renderPage('', 2, true)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'List' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Map' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))

    expect(screen.getByRole('tab', { name: 'Map' })).toHaveAttribute('aria-selected', 'true')
  })

  it('does not show placeholder text', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument()
    })
  })
})
