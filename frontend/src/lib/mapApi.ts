import { apiClient } from './apiClient'

export interface MapProperty {
  id: string
  title: string
  property_type: string
  listing_type: string
  price: number
  currency: string
  area_sqm: number
  city: string | null
  district: string | null
  latitude: number
  longitude: number
  bedrooms: number
  bathrooms: number
}

export interface MapAgent {
  id: string
  name: string
  email: string
  office: string
  phone: string
  availability_status: string
  years_experience: number
  territories: string[]
  languages: string | null
}

export const mapApi = {
  getProperties: (params?: {
    city?: string
    property_type?: string
    listing_type?: string
    min_price?: number
    max_price?: number
    status?: string
  }): Promise<MapProperty[]> => {
    const clean: Record<string, string | number | boolean> = {}
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') clean[k] = v })
    }
    return apiClient.get('/map/properties', Object.keys(clean).length ? clean : undefined)
  },

  getAgents: (): Promise<MapAgent[]> => apiClient.get('/map/agents'),
}
