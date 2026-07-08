import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import AdminAnalytics from '../AdminAnalytics'
import { adminAnalyticsApi } from '../../../lib/adminAnalyticsApi'

vi.mock('../../../lib/adminAnalyticsApi')

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderWithAuth = (user: { id: string; role: string } | null) => {
    if (user) {
      localStorage.setItem('auth_token', 'mock-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    return render(
      <MemoryRouter>
        <AuthProvider>
          <AdminAnalytics />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it('renders loading state', () => {
    vi.mocked(adminAnalyticsApi.getPropertyAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getAgentAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getClientAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getAppointmentAnalytics).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminAnalyticsApi.getEngagementAnalytics).mockReturnValue(new Promise(() => {}))
    renderWithAuth({ id: 'manager-1', role: 'manager' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
