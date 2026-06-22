// Backend Schema Mapping for Favorite Types
// Based on backend/app/schemas/property_favorite.py

export interface FavoritePropertySummary {
  id: string
  title: string
  property_type: string
  listing_type: string
  price: number
  currency: string
  city: string
  district: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_sqm: number | null
  status: string
  primary_image_url: string | null
  agent: {
    id: string
    user_id: string
    office: string
  }
}

export interface FavoriteResponse {
  id: string
  user_id: string
  property_id: string
  property: FavoritePropertySummary
  favorited_at: string
}

export interface FavoriteListResponse {
  favorites: FavoriteResponse[]
  total: number
  skip: number
  limit: number
}

export interface FavoriteCheckResponse {
  property_id: string
  is_favorited: boolean
}
