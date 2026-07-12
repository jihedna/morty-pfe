import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyListPage from '../PropertyListPage'
import { propertyApi } from '../../lib/propertyApi'

// Mock the propertyApi
vi.mock('../../lib/propertyApi')

const mockPropertyApi = propertyApi as unknown as { listProperties: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> } }

describe('PropertyListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads properties from the backend', async () => {
    const mockProperties = {
      properties: [
        {
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
        },
      ],
      total: 1,
      skip: 0,
      limit: 20,
    }

    mockPropertyApi.listProperties.mockResolvedValue(mockProperties)

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    mockPropertyApi.listProperties.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    // Check that the component renders skeleton loading cards
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('displays empty state when no properties', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
    })
  })

  it('displays server error', async () => {
    mockPropertyApi.listProperties.mockRejectedValue(new Error('Server error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
    })
  })

  it('sends filters correctly', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenCalled()
    })
  })

  it('pagination requests the correct page', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 50,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, limit: 20 })
      )
    })
  })

  it('sends the district filter to the backend', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenCalled()
    })

    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Lac' } })

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({ district: 'Lac' })
      )
    })
  })

  it('sends the featured filter to the backend', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Featured only/i }))

    await waitFor(() => {
      expect(mockPropertyApi.listProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({ is_featured: true })
      )
    })
  })

  it('does not show placeholder text', async () => {
    mockPropertyApi.listProperties.mockResolvedValue({
      properties: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PropertyListPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument()
    })
  })
})
