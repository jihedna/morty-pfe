import { apiClient } from './apiClient'

export interface MarketArea {
  id: string
  city: string
  district: string
  average_price_per_sqm: number | null
  average_rent_per_sqm: number | null
  transaction_count: number
  demand_level: string
  price_trend: string
  rental_yield: number | null
  latitude: number | null
  longitude: number | null
  updated_at: string
}

export interface HeatMapPoint extends MarketArea {
  normalized_price: number
  normalized_demand: number
}

export interface PricePerSqm {
  city: string
  district: string
  average_price_per_sqm: number
  average_rent_per_sqm: number | null
  demand_level: string
  price_trend: string
}

export const marketApi = {
  listAreas: (city?: string): Promise<MarketArea[]> =>
    apiClient.get('/market/areas', city ? { city } : undefined),

  getArea: (id: string): Promise<MarketArea> =>
    apiClient.get(`/market/areas/${id}`),

  getHeatMap: (): Promise<HeatMapPoint[]> =>
    apiClient.get('/market/areas/heat-map'),

  getPricePerSqm: (): Promise<PricePerSqm[]> =>
    apiClient.get('/market/areas/price-per-sqm'),
}
