import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, ClientSearchRequestCreate } from '../../lib/clientSearchRequestsApi'
import { PropertyType, ListingType } from '../../types/property'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { Card, PageHeader } from '../../components/ui/shared'
import FormFieldError from '../../components/common/FormFieldError'
import { extractApiError } from '../../utils/format'

export default function NewSearchRequest() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cityOptions, setCityOptions] = useState([{ value: '', label: 'Any location' }])
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm | 'budget', string>>>({})

  const initialForm = {
    property_type: '' as PropertyType | '',
    listing_type: '' as ListingType | '',
    minimum_budget: '',
    maximum_budget: '',
    preferred_city: '',
    preferred_district: '',
    minimum_bedrooms: '',
    minimum_bathrooms: '',
    minimum_area_sqm: '',
    notes: '',
  }

  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    clientSearchRequestsApi.getLocationOptions()
      .then(options => setCityOptions([{ value: '', label: 'Any location' }, ...options]))
      .catch(err => setError(extractApiError(err) || 'Failed to load property locations.'))
  }, [])

  const set = (field: keyof typeof initialForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof typeof initialForm | 'budget', string>> = {}
    if (!form.property_type) next.property_type = 'Property type is required.'
    if (!form.listing_type) next.listing_type = 'Listing type is required.'
    if (form.minimum_budget && form.maximum_budget && Number(form.minimum_budget) > Number(form.maximum_budget)) {
      next.budget = 'Minimum budget cannot exceed maximum budget.'
    }
    if (form.minimum_bedrooms && !/^[0-9]+$/.test(form.minimum_bedrooms)) next.minimum_bedrooms = 'Enter a whole number.'
    if (form.minimum_bathrooms && !/^[0-9]+$/.test(form.minimum_bathrooms)) next.minimum_bathrooms = 'Enter a whole number.'
    if (form.minimum_area_sqm && Number(form.minimum_area_sqm) <= 0) next.minimum_area_sqm = 'Area must be greater than 0.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: ClientSearchRequestCreate = {
        property_type: form.property_type as PropertyType,
        listing_type: form.listing_type as ListingType,
        ...(form.minimum_budget && { minimum_budget: Number(form.minimum_budget) }),
        ...(form.maximum_budget && { maximum_budget: Number(form.maximum_budget) }),
        ...(form.preferred_city && { preferred_city: form.preferred_city }),
        ...(form.preferred_district && { preferred_district: form.preferred_district }),
        ...(form.minimum_bedrooms && { minimum_bedrooms: Number(form.minimum_bedrooms) }),
        ...(form.minimum_bathrooms && { minimum_bathrooms: Number(form.minimum_bathrooms) }),
        ...(form.minimum_area_sqm && { minimum_area_sqm: Number(form.minimum_area_sqm) }),
        ...(form.notes && { notes: form.notes }),
      }
      await clientSearchRequestsApi.createSearchRequest(payload)
      navigate('/client/search-requests')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to create search request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const propertyTypeOptions = [
    { value: '', label: 'Select type' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Land' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'commercial', label: 'Commercial' },
  ]

  const listingTypeOptions = [
    { value: '', label: 'Select type' },
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
  ]

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="New Search Request"
          subtitle="Tell us what you're looking for and we'll match you with the right agent."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  id="property-type"
                  label="Property Type"
                  value={form.property_type}
                  onChange={v => set('property_type', v)}
                  options={propertyTypeOptions}
                  required
                />
                <FormFieldError message={errors.property_type} />
              </div>
              <div>
                <Select
                  id="listing-type"
                  label="Listing Type"
                  value={form.listing_type}
                  onChange={v => set('listing_type', v)}
                  options={listingTypeOptions}
                  required
                />
                <FormFieldError message={errors.listing_type} />
              </div>

              <Input
                id="min-budget"
                type="number"
                min="0"
                label="Min Budget (TND)"
                value={form.minimum_budget}
                onChange={v => set('minimum_budget', v)}
                placeholder="e.g. 100000"
                error={errors.budget}
              />
              <Input
                id="max-budget"
                type="number"
                min="0"
                label="Max Budget (TND)"
                value={form.maximum_budget}
                onChange={v => set('maximum_budget', v)}
                placeholder="e.g. 500000"
                error={errors.budget}
              />

              <Select
                id="preferred-city"
                label="Preferred Location"
                value={form.preferred_city}
                onChange={v => set('preferred_city', v)}
                options={cityOptions}
              />
              <Input
                id="preferred-district"
                label="District / Neighbourhood"
                value={form.preferred_district}
                onChange={v => set('preferred_district', v)}
                placeholder="e.g. Lac 2, Hammamet Nord"
              />

              <Input
                id="min-bedrooms"
                type="number"
                min="0"
                label="Min Bedrooms"
                value={form.minimum_bedrooms}
                onChange={v => set('minimum_bedrooms', v)}
                placeholder="e.g. 2"
                error={errors.minimum_bedrooms}
              />
              <Input
                id="min-bathrooms"
                type="number"
                min="0"
                label="Min Bathrooms"
                value={form.minimum_bathrooms}
                onChange={v => set('minimum_bathrooms', v)}
                placeholder="e.g. 1"
                error={errors.minimum_bathrooms}
              />
              <Input
                id="min-area"
                type="number"
                min="0"
                label="Min Area (m²)"
                value={form.minimum_area_sqm}
                onChange={v => set('minimum_area_sqm', v)}
                placeholder="e.g. 80"
                error={errors.minimum_area_sqm}
              />
            </div>

            <Textarea
              id="notes"
              label="Additional Notes"
              value={form.notes}
              onChange={v => set('notes', v)}
              placeholder="Any specific requirements or preferences..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/client/search-requests')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Request
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
