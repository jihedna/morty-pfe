import { apiClient } from './apiClient'

// ── Types ──────────────────────────────────────────────────────────────

export interface RecommendationItem {
  property_id: string
  score: number
  rank: number
  reasons: string[]
  model_version: string
  fallback: boolean
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[]
  model_status: string
  fallback: boolean
  count: number
}

export interface LeadConversionPrediction {
  conversion_probability: number
  predicted_priority: 'low' | 'medium' | 'high'
  model_version: string
  model_status: string
  top_reasons: string[]
  prediction_timestamp: string
  fallback: boolean
  experimental_label: string
}

export interface PriceEstimationRequest {
  listing_type: 'sale' | 'rent'
  city: string
  district?: string
  property_type: string
  area_sqm: number
  bedrooms: number
  bathrooms: number
  features?: string[]
}

export interface PriceEstimationResponse {
  estimate: number
  lower_estimate: number
  upper_estimate: number
  reliability: 'low' | 'medium' | 'high'
  comparable_count: number
  model_version: string
  disclaimer: string
  fallback: boolean
  data_date_range?: string
}

export interface ModelStatus {
  model_name: string
  display_name: string
  model_type: string
  purpose: string
  status: string
  version: string | null
  trained_at: string | null
  training_rows: number | null
  validation_rows: number | null
  data_date_range: string | null
  target_definition: string | null
  compatibility_version: string | null
}

export interface ModelListResponse {
  models: ModelStatus[]
}

export interface ModelMetrics {
  model_name: string
  status: string
  metrics: Record<string, unknown>
  model_version: string | null
  trained_at: string | null
  training_rows: number | null
}

// ── API ────────────────────────────────────────────────────────────────

const BASE = '/api/v1/ml'

export const mlApi = {
  getRecommendations(params?: {
    limit?: number
    city?: string
    property_type?: string
    listing_type?: string
  }): Promise<RecommendationResponse> {
    return apiClient.get(`${BASE}/recommendations`, params)
  },

  getLeadConversionPrediction(requestId: string): Promise<LeadConversionPrediction> {
    return apiClient.get(`${BASE}/leads/${requestId}/conversion-prediction`)
  },

  estimatePrice(request: PriceEstimationRequest): Promise<PriceEstimationResponse> {
    return apiClient.post(`${BASE}/price-estimation`, request)
  },

  listModels(): Promise<ModelListResponse> {
    return apiClient.get(`${BASE}/models`)
  },

  getModelStatus(modelName: string): Promise<ModelStatus> {
    return apiClient.get(`${BASE}/models/${modelName}`)
  },

  getModelMetrics(modelName: string): Promise<ModelMetrics> {
    return apiClient.get(`${BASE}/models/${modelName}/metrics`)
  },
}
