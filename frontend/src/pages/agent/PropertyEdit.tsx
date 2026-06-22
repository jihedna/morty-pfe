import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PropertyStatusActions from '../../components/property/PropertyStatusActions'
import PropertyImageManager from '../../components/property/PropertyImageManager'
import PropertyFeatureManager from '../../components/property/PropertyFeatureManager'
import { agentPropertiesApi, PropertyAgentUpdate, PropertyResponse } from '../../lib/agentPropertiesApi'
import { extractApiError } from '../../utils/format'

export default function PropertyEdit() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<PropertyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<PropertyAgentUpdate>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const loadProperty = useCallback(async () => {
    if (!propertyId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await agentPropertiesApi.getMyProperty(propertyId)
      setProperty(data)
      setFormData({
        title: data.title,
        description: data.description || undefined,
        property_type: data.property_type,
        listing_type: data.listing_type,
        status: data.status,
        price: data.price,
        currency: data.currency,
        area_sqm: data.area_sqm,
        land_area_sqm: data.land_area_sqm || undefined,
        rooms: data.rooms,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floor_number: data.floor_number,
        total_floors: data.total_floors,
        construction_year: data.construction_year || undefined,
        is_furnished: data.is_furnished,
        address_line: data.address_line || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        governorate: data.governorate || undefined,
        postal_code: data.postal_code || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      })
    } catch (err) {
      const errorMessage = extractApiError(err)
      if (errorMessage?.includes('403') || errorMessage?.includes('404')) {
        setError(errorMessage || 'Property not found or access denied')
      } else {
        setError(errorMessage || 'Failed to load property')
      }
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    loadProperty()
  }, [loadProperty])

  const handleInputChange = (field: keyof PropertyAgentUpdate, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await agentPropertiesApi.updateProperty(propertyId, formData)
      setSuccess(true)
      setHasUnsavedChanges(false)
      // Reload property to get updated data
      await loadProperty()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to update property')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description || undefined,
        property_type: property.property_type,
        listing_type: property.listing_type,
        status: property.status,
        price: property.price,
        currency: property.currency,
        area_sqm: property.area_sqm,
        land_area_sqm: property.land_area_sqm || undefined,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floor_number: property.floor_number,
        total_floors: property.total_floors,
        construction_year: property.construction_year || undefined,
        is_furnished: property.is_furnished,
        address_line: property.address_line || undefined,
        city: property.city || undefined,
        district: property.district || undefined,
        governorate: property.governorate || undefined,
        postal_code: property.postal_code || undefined,
        latitude: property.latitude || undefined,
        longitude: property.longitude || undefined,
      })
      setHasUnsavedChanges(false)
      setError(null)
      setSuccess(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading property...</span>
        </div>
      </AppLayout>
    )
  }

  if (error && (error.includes('403') || error.includes('404'))) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
          <button
            onClick={() => navigate('/agent/properties')}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Properties
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <button
            onClick={() => navigate(`/properties/${propertyId}`)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            View Property
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" role="status" aria-live="polite">
            Property updated successfully
          </div>
        )}

        {property && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={5000}
                />
              </div>
            </div>

            {/* Listing Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Listing Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type *
                  </label>
                  <select
                    id="property_type"
                    value={formData.property_type || ''}
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                    <option value="office">Office</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="listing_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Listing Type *
                  </label>
                  <select
                    id="listing_type"
                    value={formData.listing_type || ''}
                    onChange={(e) => handleInputChange('listing_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="sale">Sale</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <div className="flex items-center gap-2">
                    <PropertyStatusActions
                      propertyId={propertyId}
                      currentStatus={formData.status || property?.status || 'draft'}
                      onStatusChange={loadProperty}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Location</h2>

              <div>
                <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line
                </label>
                <input
                  type="text"
                  id="address_line"
                  value={formData.address_line || ''}
                  onChange={(e) => handleInputChange('address_line', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={300}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    id="district"
                    value={formData.district || ''}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 mb-1">
                    Governorate
                  </label>
                  <input
                    type="text"
                    id="governorate"
                    value={formData.governorate || ''}
                    onChange={(e) => handleInputChange('governorate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    value={formData.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={formData.currency || ''}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TND">TND</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Price</h2>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={0}
                  step={0.01}
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Dimensions</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="area_sqm" className="block text-sm font-medium text-gray-700 mb-1">
                    Area (sqm) *
                  </label>
                  <input
                    type="number"
                    id="area_sqm"
                    value={formData.area_sqm || ''}
                    onChange={(e) => handleInputChange('area_sqm', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min={0}
                    step={0.01}
                  />
                </div>

                <div>
                  <label htmlFor="land_area_sqm" className="block text-sm font-medium text-gray-700 mb-1">
                    Land Area (sqm)
                  </label>
                  <input
                    type="number"
                    id="land_area_sqm"
                    value={formData.land_area_sqm || ''}
                    onChange={(e) => handleInputChange('land_area_sqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Rooms</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    id="rooms"
                    value={formData.rooms || ''}
                    onChange={(e) => handleInputChange('rooms', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    value={formData.bedrooms || ''}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    value={formData.bathrooms || ''}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div>
                  <label htmlFor="floor_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    id="floor_number"
                    value={formData.floor_number || ''}
                    onChange={(e) => handleInputChange('floor_number', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div>
                  <label htmlFor="total_floors" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    id="total_floors"
                    value={formData.total_floors || ''}
                    onChange={(e) => handleInputChange('total_floors', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div>
                  <label htmlFor="construction_year" className="block text-sm font-medium text-gray-700 mb-1">
                    Construction Year
                  </label>
                  <input
                    type="number"
                    id="construction_year"
                    value={formData.construction_year || ''}
                    onChange={(e) => handleInputChange('construction_year', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={1800}
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="is_furnished"
                    checked={formData.is_furnished || false}
                    onChange={(e) => handleInputChange('is_furnished', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_furnished" className="ml-2 block text-sm text-gray-900">
                    Furnished
                  </label>
                </div>
              </div>
            </div>

            {/* Image Management */}
            {property && (
              <PropertyImageManager
                propertyId={propertyId}
                images={property.images}
                onImagesChange={loadProperty}
              />
            )}

            {/* Feature Management */}
            {property && (
              <PropertyFeatureManager
                propertyId={propertyId}
                features={property.features}
                onFeaturesChange={loadProperty}
              />
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving || !hasUnsavedChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/agent/properties')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back to Properties
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
