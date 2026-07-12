import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PropertyStatusActions from '../../components/property/PropertyStatusActions'
import PropertyImageManager from '../../components/property/PropertyImageManager'
import PropertyFeatureManager from '../../components/property/PropertyFeatureManager'
import PropertyForm from '../../components/property/PropertyForm'
import { PageHeader, LoadingState, ErrorState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { agentPropertiesApi, PropertyAgentUpdate, PropertyResponse } from '../../lib/agentPropertiesApi'
import { extractApiError, normalizeValidationError } from '../../utils/format'

export default function PropertyEdit() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const [property, setProperty] = useState<PropertyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<PropertyAgentUpdate>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadProperty = useCallback(async () => {
    if (!propertyId) return

    setIsLoading(true)
    setError(null)
    setFieldErrors({})

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
      setHasUnsavedChanges(false)
      setSuccess(false)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load property')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    loadProperty()
  }, [loadProperty])

  const handleInputChange = (field: keyof PropertyAgentUpdate, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }) as PropertyAgentUpdate)
    setHasUnsavedChanges(true)
    setSuccess(false)
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (formData.title && formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters'
    }
    if (formData.price !== undefined && formData.price <= 0) {
      errors.price = 'Price must be greater than 0'
    }
    if (formData.area_sqm !== undefined && formData.area_sqm <= 0) {
      errors.area_sqm = 'Area must be greater than 0'
    }
    if (
      formData.bedrooms !== undefined &&
      formData.rooms !== undefined &&
      formData.rooms > 0 &&
      formData.bedrooms > formData.rooms
    ) {
      errors.bedrooms = 'Bedrooms cannot exceed total rooms'
    }
    if (
      formData.floor_number !== undefined &&
      formData.total_floors !== undefined &&
      formData.total_floors > 0 &&
      formData.floor_number > formData.total_floors
    ) {
      errors.floor_number = 'Floor number cannot exceed total floors'
    }
    if ((formData.latitude !== undefined) !== (formData.longitude !== undefined)) {
      errors.latitude = 'Latitude and longitude must both be present or absent'
      errors.longitude = 'Latitude and longitude must both be present or absent'
    }
    if (
      formData.construction_year !== undefined &&
      (formData.construction_year < 1800 || formData.construction_year > new Date().getFullYear())
    ) {
      errors.construction_year = `Construction year must be between 1800 and ${new Date().getFullYear()}`
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return
    setError(null)
    setSuccess(false)
    if (!validate()) return

    setIsSaving(true)
    try {
      await agentPropertiesApi.updateProperty(propertyId, formData)
      setSuccess(true)
      setHasUnsavedChanges(false)
      await loadProperty()
    } catch (err) {
      const validation = normalizeValidationError(err)
      const fieldErrorsMap: Record<string, string> = {}
      Object.entries(validation).forEach(([key, messages]) => {
        if (key !== 'detail' && Array.isArray(messages) && messages.length > 0) {
          fieldErrorsMap[key] = messages[0]
        }
      })
      if (Object.keys(fieldErrorsMap).length > 0) {
        setFieldErrors(fieldErrorsMap)
      } else {
        setError(validation.detail?.join(', ') || extractApiError(err) || 'Failed to update property')
      }
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
      setFieldErrors({})
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message="Loading property…" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Edit Property"
          subtitle={property?.title}
          action={
            <Button as="Link" to={`/properties/${propertyId}`} variant="secondary">
              View Property
            </Button>
          }
        />

        {error && <ErrorState message={error} onRetry={loadProperty} />}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-2xl" role="status" aria-live="polite">
            Property updated successfully
          </div>
        )}

        {property && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <PropertyForm
              formData={formData}
              onChange={handleInputChange}
              fieldErrors={fieldErrors}
              disabled={isSaving}
              status={
                <PropertyStatusActions
                  propertyId={propertyId}
                  currentStatus={formData.status || property.status}
                  onStatusChange={loadProperty}
                />
              }
            />

            <PropertyImageManager propertyId={propertyId} images={property.images} onImagesChange={loadProperty} />
            <PropertyFeatureManager propertyId={propertyId} features={property.features} onFeaturesChange={loadProperty} />

            <div className="flex flex-wrap gap-4">
              <Button type="submit" isLoading={isSaving} disabled={isSaving || !hasUnsavedChanges}>
                Save Changes
              </Button>
              {hasUnsavedChanges && (
                <Button type="button" variant="secondary" onClick={handleDiscard}>
                  Discard Changes
                </Button>
              )}
              <Button as="Link" to="/agent/properties" variant="outline">
                Back to Properties
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
