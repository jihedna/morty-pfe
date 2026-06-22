import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import FavoritesPage from '../FavoritesPage'
import { propertyApi } from '../../../lib/propertyApi'

// Mock the propertyApi
vi.mock('../../../lib/propertyApi')

const mockPropertyApi = propertyApi as unknown as { listFavorites: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> } }

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads favorites from the backend', async () => {
    const mockFavorites = {
      favorites: [
        {
          id: '1',
          property_id: 'prop-1',
          favorited_at: '2024-01-01',
          property: {
            id: 'prop-1',
            title: 'Test Property',
            property_type: 'apartment' as const,
            listing_type: 'sale' as const,
            status: 'available' as const,
            price: 100000,
            currency: 'TND' as const,
            area_sqm: 100,
            bedrooms: 2,
            bathrooms: 1,
            city: 'Tunis',
            district: 'Tunis',
            primary_image_url: 'https://example.com/image.jpg',
          },
        },
      ],
      total: 1,
      skip: 0,
      limit: 20,
    }

    mockPropertyApi.listFavorites.mockResolvedValue(mockFavorites)

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <FavoritesPage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(container).toBeInTheDocument()
      expect(mockPropertyApi.listFavorites).toHaveBeenCalled()
    })
  })

  it('displays loading state', () => {
    mockPropertyApi.listFavorites.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <FavoritesPage />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(container).toBeInTheDocument()
  })

  it('displays empty state when no favorites', async () => {
    mockPropertyApi.listFavorites.mockResolvedValue({
      favorites: [],
      total: 0,
      skip: 0,
      limit: 20,
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <FavoritesPage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
    })
  })

  it('displays server error', async () => {
    mockPropertyApi.listFavorites.mockRejectedValue(new Error('Server error'))

    render(
      <MemoryRouter>
        <AuthProvider>
          <FavoritesPage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument()
    })
  })
})
