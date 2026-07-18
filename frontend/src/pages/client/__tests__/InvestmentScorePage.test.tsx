import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider } from '../../../contexts/AuthContext'
import InvestmentScorePage from '../InvestmentScorePage'
import { investmentApi } from '../../../lib/investmentApi'
import type { InvestmentScoreResponse } from '../../../lib/investmentApi'

const mockUser = {
  id: 'user-1',
  email: 'client@example.com',
  first_name: 'Amine',
  last_name: 'Client',
  role: 'client' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockResult: InvestmentScoreResponse = {
  investment_score: 84,
  demand_score: 90,
  affordability_score: 75,
  rental_yield_score: 80,
  growth_score: 85,
  liquidity_score: 70,
  explanation: 'Location: Tunis – Lac 1 | Avg price: 2,500 TND/m² | Avg rent: 12 TND/m²/month | Rental yield: 5.8% | Demand: high | Trend: rising',
  risks: ['No major risks identified based on available data.'],
  recommendation: 'Strong investment opportunity in Tunis – Lac 1 for rental_income.',
  data_note: 'Based on DEMO market data for Tunis / Lac 1. Import real contract data for accurate scores.',
}

vi.mock('../../../lib/investmentApi')

const getScore = vi.mocked(investmentApi.getScore)

function renderPage() {
  localStorage.setItem('auth_token', 'mock-token')
  localStorage.setItem('auth_user', JSON.stringify(mockUser))
  return render(
    <MemoryRouter initialEntries={['/client/investment-score']}>
      <AuthProvider>
        <InvestmentScorePage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('InvestmentScorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the form and page heading', () => {
    renderPage()
    expect(screen.getByText('Score d\'Investissement')).toBeInTheDocument()
    expect(screen.getByLabelText('Ville')).toBeInTheDocument()
    expect(screen.getByLabelText('Budget en TND')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calculer le score' })).toBeInTheDocument()
  })

  it('shows validation error when city or budget is missing', async () => {
    renderPage()
    const button = screen.getByRole('button', { name: 'Calculer le score' })
    await userEvent.click(button)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Veuillez renseigner la ville et le budget.')
    })
  })

  it('submits the form and displays the score, grade, and metrics', async () => {
    getScore.mockResolvedValue(mockResult)
    renderPage()

    await userEvent.type(screen.getByLabelText('Ville'), 'Tunis')
    await userEvent.type(screen.getByLabelText('Budget en TND'), '300000')
    await userEvent.click(screen.getByRole('button', { name: 'Calculer le score' }))

    await waitFor(() => {
      expect(screen.getByText('84')).toBeInTheDocument()
      expect(screen.getByText('FORTE OPPORTUNITÉ')).toBeInTheDocument()
      expect(screen.getByText('Rendement locatif', { selector: 'p' })).toBeInTheDocument()
      expect(screen.getByText('Demande', { selector: 'p' })).toBeInTheDocument()
      expect(screen.getByText('Croissance', { selector: 'p' })).toBeInTheDocument()
      expect(screen.getByText(mockResult.recommendation)).toBeInTheDocument()
    })

    expect(getScore).toHaveBeenCalledWith(expect.objectContaining({
      city: 'Tunis',
      budget: 300000,
      property_type: 'apartment',
    }))
  })

  it('renders score breakdown and risks', async () => {
    getScore.mockResolvedValue(mockResult)
    renderPage()

    await userEvent.type(screen.getByLabelText('Ville'), 'Tunis')
    await userEvent.type(screen.getByLabelText('Budget en TND'), '300000')
    await userEvent.click(screen.getByRole('button', { name: 'Calculer le score' }))

    await waitFor(() => {
      expect(screen.getByText('Détail des scores')).toBeInTheDocument()
      expect(screen.getByText('Risques identifiés')).toBeInTheDocument()
      expect(screen.getByText(mockResult.risks[0])).toBeInTheDocument()
      expect(screen.getByText(/titre informatif/i)).toBeInTheDocument()
    })
  })

  it('displays API errors', async () => {
    getScore.mockRejectedValue({ detail: 'City not found' })
    renderPage()

    await userEvent.type(screen.getByLabelText('Ville'), 'Unknown')
    await userEvent.type(screen.getByLabelText('Budget en TND'), '100000')
    await userEvent.click(screen.getByRole('button', { name: 'Calculer le score' }))

    await waitFor(() => {
      expect(screen.getByText('City not found')).toBeInTheDocument()
    })
  })

  it('prevents duplicate submission while loading', async () => {
    getScore.mockImplementation(() => new Promise(() => {}))
    renderPage()

    await userEvent.type(screen.getByLabelText('Ville'), 'Tunis')
    await userEvent.type(screen.getByLabelText('Budget en TND'), '300000')
    const button = screen.getByRole('button', { name: 'Calculer le score' })
    await userEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })
  })

  it('reuses AppLayout and does not duplicate portal sidebar', () => {
    renderPage()
    expect(screen.getByText('Score d\'Investissement')).toBeInTheDocument()
    expect(screen.queryAllByText('Sign Out')).toHaveLength(2)
    expect(screen.queryByText('AI Driven')).not.toBeInTheDocument()
    expect(screen.queryByText('Active Portfolio:')).not.toBeInTheDocument()
  })

  it('does not show a hardcoded score of 84 before submission', () => {
    renderPage()
    expect(screen.queryByText('84')).not.toBeInTheDocument()
  })
})
