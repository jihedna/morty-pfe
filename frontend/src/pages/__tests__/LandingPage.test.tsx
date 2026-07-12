import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import LandingPage from '../LandingPage'

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const renderPage = () =>
    render(
      <BrowserRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </BrowserRouter>
    )

  it('renders the hero with required CTA buttons', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /The Future of Real Estate is Driven by AI/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ask AI Assistant/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Find an Agent/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Browse Properties/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the required feature cards', () => {
    renderPage()

    ;[
      'AI Agent Matching',
      'Smart Property Search',
      'Market Insights',
      'Investment Score',
      'Appointments',
      'Secure Messaging',
    ].forEach((title) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    })
  })

  it('renders the how it works steps', () => {
    renderPage()

    ;['Search', 'Match', 'Visit', 'Close'].forEach((step) => {
      expect(screen.getByRole('heading', { name: step })).toBeInTheDocument()
    })
  })

  it('does not show placeholder or sample data text', () => {
    renderPage()

    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/demonstration purposes/i)).not.toBeInTheDocument()
  })
})
