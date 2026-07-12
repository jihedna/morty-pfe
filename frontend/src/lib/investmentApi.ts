import { apiClient } from './apiClient'

export interface InvestmentScoreRequest {
  city: string
  district?: string
  budget: number
  property_type: string
  listing_type?: string
  investment_goal?: string
}

export interface InvestmentScoreResponse {
  investment_score: number
  demand_score: number
  affordability_score: number
  rental_yield_score: number
  growth_score: number
  liquidity_score: number
  explanation: string
  risks: string[]
  recommendation: string
  data_note: string
}

export const investmentApi = {
  getScore: (req: InvestmentScoreRequest): Promise<InvestmentScoreResponse> =>
    apiClient.post('/investment/score', req),
}
