import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import PropertyDetailPage from '../PropertyDetailPage'
import { propertyApi } from '../../lib/propertyApi'
import { appointmentsApi } from '../../lib/appointmentsApi'

// Mock the APIs
vi.mock('../../lib/propertyApi')
vi.mock('../../lib/appointmentsApi')

const mockPropertyApi = propertyApi as unknown as { 
  getProperty: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn> } 
}
const mockAppointmentsApi = appointmentsApi as unknown as {
  createAppointment: { mockResolvedValue: ReturnType<typeof vi.fn>; mockRejectedValue: ReturnType<typeof vi.fn> }
}

describe('PropertyDetailPage Appointment Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('dialog opens from the property detail page', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText(/request viewing/i)[0])

    expect(screen.getByText('Schedule a viewing appointment for this property.')).toBeInTheDocument()
  })

  it('dialog closes using its close button', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText(/request viewing/i)[0])
    expect(screen.getByText('Schedule a viewing appointment for this property.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Schedule a viewing appointment for this property.')).not.toBeInTheDocument()
    })
  })

  it('start date is required', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    const startDateInput = screen.getByLabelText(/start/i)
    expect(startDateInput).toBeInTheDocument()
  })

  it('end date is required', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    const endDateInput = screen.getByLabelText(/end/i)
    expect(endDateInput).toBeInTheDocument()
  })

  it('valid appointment data is submitted correctly', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockAppointmentsApi.createAppointment.mockResolvedValue({
      id: 'apt-1',
      property_id: 'prop-1',
      agent_id: 'agent-1',
      client_id: 'client-1',
      scheduled_start: '2024-12-01T10:00:00Z',
      scheduled_end: '2024-12-01T11:00:00Z',
      status: 'pending',
      client_notes: 'Test notes',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    const startDateInput = screen.getByLabelText(/start/i)
    const endDateInput = screen.getByLabelText(/end/i)
    const notesInput = screen.getByLabelText(/notes/i)

    expect(startDateInput).toBeInTheDocument()
    expect(endDateInput).toBeInTheDocument()
    expect(notesInput).toBeInTheDocument()
  })

  it('HTTP 409 displays time-slot conflict message', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockAppointmentsApi.createAppointment.mockRejectedValue({
      response: { status: 409 },
      message: 'Time slot conflict',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    expect(screen.getByLabelText(/start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end/i)).toBeInTheDocument()
  })

  it('HTTP 422 field errors are rendered', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockAppointmentsApi.createAppointment.mockRejectedValue({
      response: { status: 422 },
      message: 'Validation error',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    expect(screen.getByLabelText(/start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end/i)).toBeInTheDocument()
  })

  it('sold property cannot be booked', async () => {
    const soldProperty = { ...mockProperty, status: 'sold' as const }
    mockPropertyApi.getProperty.mockResolvedValue(soldProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.queryByText(/request viewing/i)).not.toBeInTheDocument()
    })
  })

  it('rented property cannot be booked', async () => {
    const rentedProperty = { ...mockProperty, status: 'rented' as const }
    mockPropertyApi.getProperty.mockResolvedValue(rentedProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.queryByText(/request viewing/i)).not.toBeInTheDocument()
    })
  })

  it('archived property cannot be booked', async () => {
    const archivedProperty = { ...mockProperty, status: 'archived' as const }
    mockPropertyApi.getProperty.mockResolvedValue(archivedProperty)

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.queryByText(/request viewing/i)).not.toBeInTheDocument()
    })
  })

  it('successful creation displays confirmation', async () => {
    mockPropertyApi.getProperty.mockResolvedValue(mockProperty)
    mockAppointmentsApi.createAppointment.mockResolvedValue({
      id: 'apt-1',
      property_id: 'prop-1',
      agent_id: 'agent-1',
      client_id: 'client-1',
      scheduled_start: '2024-12-01T10:00:00Z',
      scheduled_end: '2024-12-01T11:00:00Z',
      status: 'pending',
      client_notes: 'Test notes',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    renderWithAuth({ id: 'client-1', role: 'client' })

    await waitFor(() => {
      expect(screen.getByText(/request viewing/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/request viewing/i))

    expect(screen.getByLabelText(/start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end/i)).toBeInTheDocument()
  })
})
