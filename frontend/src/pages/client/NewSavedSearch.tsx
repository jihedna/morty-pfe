import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card, PageHeader } from '../../components/ui/shared'
import { clientSearchRequestsApi, PropertyLocationOption } from '../../lib/clientSearchRequestsApi'
import { savedSearchesApi } from '../../lib/savedSearchesApi'
import { extractApiError } from '../../utils/format'

const initialForm = {
  name: '',
  property_type: '',
  listing_type: '',
  location: '',
  minimum_price: '',
  maximum_price: '',
  minimum_bedrooms: '',
  minimum_bathrooms: '',
  minimum_area_sqm: '',
  notifications_enabled: true,
}

export default function NewSavedSearch() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [locations, setLocations] = useState<PropertyLocationOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    clientSearchRequestsApi.getLocationOptions()
      .then(setLocations)
      .catch(err => setError(extractApiError(err) || 'Failed to load property locations.'))
  }, [])

  const set = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setError('Search name is required.')
      return
    }
    if (form.minimum_price && form.maximum_price && Number(form.minimum_price) > Number(form.maximum_price)) {
      setError('Minimum price cannot exceed maximum price.')
      return
    }

    const selectedLocation = locations.find(option => option.value === form.location)
    const filters: Record<string, unknown> = {}
    if (form.property_type) filters.property_type = form.property_type
    if (form.listing_type) filters.listing_type = form.listing_type
    if (selectedLocation) filters.city = selectedLocation.city
    if (form.minimum_price) filters.minimum_price = Number(form.minimum_price)
    if (form.maximum_price) filters.maximum_price = Number(form.maximum_price)
    if (form.minimum_bedrooms) filters.minimum_bedrooms = Number(form.minimum_bedrooms)
    if (form.minimum_bathrooms) filters.minimum_bathrooms = Number(form.minimum_bathrooms)
    if (form.minimum_area_sqm) filters.minimum_area_sqm = Number(form.minimum_area_sqm)

    if (Object.keys(filters).length === 0) {
      setError('Choose at least one search criterion.')
      return
    }

    setIsSubmitting(true)
    try {
      await savedSearchesApi.createSavedSearch({
        name,
        filters,
        notifications_enabled: form.notifications_enabled,
      })
      navigate('/client/saved-searches')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to save search.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Create Saved Search"
          subtitle="Save your criteria and get notified when matching properties are added."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="saved-search-name"
              label="Search Name"
              value={form.name}
              onChange={value => set('name', value)}
              placeholder="e.g. Terrain in Kram"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="saved-property-type"
                label="Property Type"
                value={form.property_type}
                onChange={value => set('property_type', value)}
                options={[
                  { value: '', label: 'Any type' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'house', label: 'House' },
                  { value: 'villa', label: 'Villa' },
                  { value: 'land', label: 'Land' },
                  { value: 'terrain', label: 'Terrain' },
                  { value: 'office', label: 'Office' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'warehouse', label: 'Warehouse' },
                  { value: 'penthouse', label: 'Penthouse' },
                  { value: 'studio', label: 'Studio' },
                  { value: 'duplex', label: 'Duplex' },
                ]}
              />
              <Select
                id="saved-listing-type"
                label="Listing Type"
                value={form.listing_type}
                onChange={value => set('listing_type', value)}
                options={[
                  { value: '', label: 'Any listing type' },
                  { value: 'sale', label: 'For Sale' },
                  { value: 'rent', label: 'For Rent' },
                ]}
              />
              <Select
                id="saved-location"
                label="Location"
                value={form.location}
                onChange={value => set('location', value)}
                options={[
                  { value: '', label: 'Any location' },
                  ...locations.map(({ value, label }) => ({ value, label })),
                ]}
              />
              <Input id="saved-min-area" type="number" min="0" label="Minimum Area (m²)" value={form.minimum_area_sqm} onChange={value => set('minimum_area_sqm', value)} />
              <Input id="saved-min-price" type="number" min="0" label="Minimum Price (TND)" value={form.minimum_price} onChange={value => set('minimum_price', value)} />
              <Input id="saved-max-price" type="number" min="0" label="Maximum Price (TND)" value={form.maximum_price} onChange={value => set('maximum_price', value)} />
              <Input id="saved-min-bedrooms" type="number" min="0" step="1" label="Minimum Bedrooms" value={form.minimum_bedrooms} onChange={value => set('minimum_bedrooms', value)} />
              <Input id="saved-min-bathrooms" type="number" min="0" step="1" label="Minimum Bathrooms" value={form.minimum_bathrooms} onChange={value => set('minimum_bathrooms', value)} />
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifications_enabled}
                onChange={event => set('notifications_enabled', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Notify me when new properties match this search
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/client/saved-searches')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Search'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
