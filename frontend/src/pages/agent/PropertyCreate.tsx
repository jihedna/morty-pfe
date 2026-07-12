import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { PageHeader, ErrorState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import PropertyForm from '../../components/property/PropertyForm'
import { agentPropertiesApi, PropertyAgentCreate, PropertyAgentUpdate } from '../../lib/agentPropertiesApi'
import { extractApiError, normalizeValidationError } from '../../utils/format'

const initialFormData: PropertyAgentUpdate = {
  title: '',
  description: undefined,
  property_type: 'apartment',
  listing_type: 'sale',
  status: 'draft',
  price: 0,
  currency: 'TND',
  area_sqm: 0,
  land_area_sqm: undefined,
  rooms: 0,
  bedrooms: 0,
  bathrooms: 0,
  floor_number: 0,
  total_floors: 0,
  construction_year: undefined,
  is_furnished: false,
  address_line: undefined,
  city: undefined,
  district: undefined,
  governorate: undefined,
  postal_code: undefined,
  latitude: undefined,
  longitude: undefined,
}

export default function PropertyCreate() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PropertyAgentUpdate>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof PropertyAgentUpdate, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }) as PropertyAgentUpdate)
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    setError(null)
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters'
    }
    if (!formData.property_type) {
      errors.property_type = 'Property type is required'
    }
    if (!formData.listing_type) {
      errors.listing_type = 'Listing type is required'
    }
    if (!formData.status) {
      errors.status = 'Status is required'
    }
    if (formData.price === undefined || formData.price <= 0) {
      errors.price = 'Price must be greater than 0'
    }
    if (formData.area_sqm === undefined || formData.area_sqm <= 0) {
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
    setError(null)
    if (!validate()) return

    setIsSaving(true)
    try {
      const property = await agentPropertiesApi.createProperty(formData as PropertyAgentCreate)
      navigate(`/agent/properties/${property.id}/edit`)
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
        setError(validation.detail?.join(', ') || extractApiError(err) || 'Failed to create property')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Add New Property" />

        {error && <ErrorState message={error} onRetry={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <PropertyForm
            formData={formData}
            onChange={handleInputChange}
            fieldErrors={fieldErrors}
            disabled={isSaving}
          />

          <div className="flex flex-wrap gap-4">
            <Button type="submit" isLoading={isSaving} disabled={isSaving}>
              Create Property
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/agent/properties')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
