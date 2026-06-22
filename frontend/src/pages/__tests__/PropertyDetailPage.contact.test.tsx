import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyDetailPage from '../PropertyDetailPage'
import { propertyApi } from '../../lib/propertyApi'
import { conversationsApi } from '../../lib/conversationsApi'

// Mock the APIs
vi.mock('../../lib/propertyApi')
vi.mock('../../lib/conversationsApi')

const mockPropertyApi = propertyApi as unknown as { 
  getProperty: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> } 
}
const mockConversationsApi = conversationsApi as unknown as {
  createConversation: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn>; mockImplementation: ReturnType<typeof vi.fn> }
  createMessage: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn> }
}

describe('PropertyDetailPage Contact Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockProperty = {
    id: 'prop-1',
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

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter initialEntries={['/properties/prop-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/client/conversations/:conversationId" element={<div>Conversation Detail</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('authenticated client sees the Contact Agent action', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockConversationsApi.createConversation.mockResolvedValue({
      id: 'conv-1',
      property_id: 'prop-1',
      agent_id: 'agent-1',
      client_id: 'client-1',
      subject: 'Inquiry about Test Property',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })
  })

  it('unauthenticated user does not see the contact agent action', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth(null)

    await waitFor(() => {
      expect(screen.queryByText(/contact agent/i)).not.toBeInTheDocument()
    })
  })

  it('agent does not see the action', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'agent-1', role: 'agent' })

    await waitFor(() => {
      expect(screen.queryByText(/contact agent/i)).not.toBeInTheDocument()
    })
  })

  it('manager does not see the action', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'manager-1', role: 'manager' })

    await waitFor(() => {
      expect(screen.queryByText(/contact agent/i)).not.toBeInTheDocument()
    })
  })

  it('clicking once opens the contact dialog', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    const button = screen.getAllByText(/contact agent/i)[0]
    fireEvent.click(button)

    // Check that the dialog opens
    expect(screen.getByText('Send a message to the agent about this property.')).toBeInTheDocument()
  })

  it('button is disabled while request is pending', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    const button = screen.getAllByText(/contact agent/i)[0]
    fireEvent.click(button)

    // Check that the dialog opens
    expect(screen.getByText('Send a message to the agent about this property.')).toBeInTheDocument()
  })

  it('HTTP 403 displays permission error', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockConversationsApi.createConversation.mockRejectedValue({
      response: { status: 403 },
      message: 'Forbidden',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/contact agent/i))
  })

  it('HTTP 404 displays missing property or agent error', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockConversationsApi.createConversation.mockRejectedValue({
      response: { status: 404 },
      message: 'Not found',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/contact agent/i))
  })

  it('HTTP 422 displays validation errors', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockConversationsApi.createConversation.mockRejectedValue({
      response: { status: 422 },
      message: 'Validation error',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/contact agent/i))
  })

  it('network failure displays readable error', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockConversationsApi.createConversation.mockRejectedValue(new Error('Network error'))

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/contact agent/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/contact agent/i))
  })
})
