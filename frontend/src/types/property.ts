// Backend Schema Mapping for Property Types
// Based on backend/app/schemas/property.py

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  LAND = 'land',
  OFFICE = 'office',
  COMMERCIAL = 'commercial',
  WAREHOUSE = 'warehouse',
  PENTHOUSE = 'penthouse',
  STUDIO = 'studio',
  DUPLEX = 'duplex',
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyStatus {
  DRAFT = 'draft',
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  RENTED = 'rented',
  ARCHIVED = 'archived',
}

export enum Currency {
  TND = 'TND',
  USD = 'USD',
  EUR = 'EUR',
}

export enum PropertyFeatureEnum {
  SWIMMING_POOL = 'swimming_pool',
  GARDEN = 'garden',
  PARKING = 'parking',
  SECURITY = 'security',
  ELEVATOR = 'elevator',
  AIR_CONDITIONING = 'air_conditioning',
  BALCONY = 'balcony',
  TERRACE = 'terrace',
  FIREPLACE = 'fireplace',
  GYM = 'gym',
  CONCIERGE = 'concierge',
  STORAGE = 'storage',
  LAUNDRY = 'laundry',
  DISHWASHER = 'dishwasher',
  CENTRAL_HEATING = 'central_heating',
  DOUBLE_GLAZING = 'double_glazing',
}

export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  alt_text: string | null
  position: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface PropertyFeature {
  id: string
  property_id: string
  feature: PropertyFeatureEnum
  created_at: string
  updated_at: string
}

export interface PropertyAgentSummary {
  id: string
  user_id: string
  office: string
}

export interface PropertyPublicResponse {
  id: string
  reference_code: string
  title: string
  description: string | null
  property_type: PropertyType
  listing_type: ListingType
  status: PropertyStatus
  price: number
  currency: Currency
  area_sqm: number
  land_area_sqm: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  floor_number: number
  total_floors: number
  construction_year: number | null
  is_furnished: boolean
  is_featured: boolean
  address_line: string | null
  city: string | null
  district: string | null
  governorate: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  published_at: string | null
  created_at: string
  updated_at: string
  agent_id: string
  images: PropertyImage[]
  features: PropertyFeature[]
}

export interface PropertyListFilters {
  search?: string
  property_type?: PropertyType
  listing_type?: ListingType
  city?: string
  district?: string
  governorate?: string
  agent_id?: string
  minimum_price?: number
  maximum_price?: number
  minimum_area?: number
  maximum_area?: number
  minimum_bedrooms?: number
  minimum_bathrooms?: number
  feature?: PropertyFeatureEnum
  is_furnished?: boolean
  is_featured?: boolean
  skip?: number
  limit?: number
  sort_by?: string
  sort_direction?: string
}

export interface PropertyListResponse {
  properties: PropertyPublicResponse[]
  total: number
  skip: number
  limit: number
}

export interface PropertyMapItem {
  id: string
  title: string
  address_line: string | null
  city: string | null
  district: string | null
  governorate: string | null
  property_type: PropertyType
  listing_type: ListingType
  price: number
  currency: Currency
  latitude: number
  longitude: number
  bedrooms: number
  bathrooms: number
  area_sqm: number
}
