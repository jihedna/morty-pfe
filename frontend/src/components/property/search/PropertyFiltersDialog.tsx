import { useState, useEffect } from 'react'
import { PropertyListFilters, ListingType, PropertyType, PropertyFeatureEnum } from '../../../types/property'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'

interface PropertyFiltersDialogProps {
  isOpen: boolean
  filters: PropertyListFilters
  onClose: () => void
  onApply: (filters: PropertyListFilters) => void
}

const listingTypeOptions = [
  { value: '', label: 'Any' },
  { value: ListingType.SALE, label: 'For Sale' },
  { value: ListingType.RENT, label: 'For Rent' },
]

const propertyTypeOptions = [
  { value: '', label: 'Any' },
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.LAND, label: 'Land' },
  { value: PropertyType.TERRAIN, label: 'Terrain' },
  { value: PropertyType.OFFICE, label: 'Office' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse' },
  { value: PropertyType.PENTHOUSE, label: 'Penthouse' },
  { value: PropertyType.STUDIO, label: 'Studio' },
  { value: PropertyType.DUPLEX, label: 'Duplex' },
]

const featureOptions = [
  { value: '', label: 'Any' },
  { value: PropertyFeatureEnum.SWIMMING_POOL, label: 'Swimming Pool' },
  { value: PropertyFeatureEnum.GARDEN, label: 'Garden' },
  { value: PropertyFeatureEnum.PARKING, label: 'Parking' },
  { value: PropertyFeatureEnum.SECURITY, label: 'Security' },
  { value: PropertyFeatureEnum.ELEVATOR, label: 'Elevator' },
  { value: PropertyFeatureEnum.AIR_CONDITIONING, label: 'Air Conditioning' },
  { value: PropertyFeatureEnum.BALCONY, label: 'Balcony' },
  { value: PropertyFeatureEnum.TERRACE, label: 'Terrace' },
  { value: PropertyFeatureEnum.STORAGE, label: 'Storage' },
  { value: PropertyFeatureEnum.CENTRAL_HEATING, label: 'Central Heating' },
  { value: PropertyFeatureEnum.SEA_VIEW, label: 'Sea View' },
  { value: PropertyFeatureEnum.ACCESSIBLE_ENTRY, label: 'Accessible Entry' },
]

const booleanOptions = [
  { value: '', label: 'Any' },
  { value: 'true', label: 'Yes' },
]

function numberValue(value: string): number | undefined {
  if (value === '') return undefined
  const parsed = Number(value)
  return isNaN(parsed) ? undefined : parsed
}

export function PropertyFiltersDialog({ isOpen, filters, onClose, onApply }: PropertyFiltersDialogProps) {
  const [draft, setDraft] = useState<PropertyListFilters>(filters)

  useEffect(() => {
    setDraft(filters)
  }, [filters, isOpen])

  const handleChange = (key: keyof PropertyListFilters, value: string | number | boolean | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: value } as PropertyListFilters))
  }

  const handleReset = () => {
    setDraft({
      search: draft.search,
      sort_by: draft.sort_by,
      sort_direction: draft.sort_direction,
      skip: draft.skip,
      limit: draft.limit,
    })
  }

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="More Filters"
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleApply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="more_listing_type"
          label="Listing Type"
          value={draft.listing_type || ''}
          onChange={(value) => handleChange('listing_type', value || undefined)}
          options={listingTypeOptions}
        />

        <Select
          id="more_property_type"
          label="Property Type"
          value={draft.property_type || ''}
          onChange={(value) => handleChange('property_type', value || undefined)}
          options={propertyTypeOptions}
        />

        <Input
          id="more_city"
          label="City"
          value={draft.city || ''}
          onChange={(value) => handleChange('city', value || undefined)}
        />

        <Input
          id="more_district"
          label="District"
          value={draft.district || ''}
          onChange={(value) => handleChange('district', value || undefined)}
        />

        <Input
          id="more_governorate"
          label="Governorate"
          value={draft.governorate || ''}
          onChange={(value) => handleChange('governorate', value || undefined)}
        />

        <Select
          id="more_feature"
          label="Feature"
          value={draft.feature || ''}
          onChange={(value) => handleChange('feature', value || undefined)}
          options={featureOptions}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="more_minimum_price"
            label="Min Price"
            type="number"
            value={draft.minimum_price ? String(draft.minimum_price) : ''}
            onChange={(value) => handleChange('minimum_price', numberValue(value))}
          />
          <Input
            id="more_maximum_price"
            label="Max Price"
            type="number"
            value={draft.maximum_price ? String(draft.maximum_price) : ''}
            onChange={(value) => handleChange('maximum_price', numberValue(value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="more_minimum_area"
            label="Min Area (m²)"
            type="number"
            value={draft.minimum_area ? String(draft.minimum_area) : ''}
            onChange={(value) => handleChange('minimum_area', numberValue(value))}
          />
          <Input
            id="more_maximum_area"
            label="Max Area (m²)"
            type="number"
            value={draft.maximum_area ? String(draft.maximum_area) : ''}
            onChange={(value) => handleChange('maximum_area', numberValue(value))}
          />
        </div>

        <Select
          id="more_minimum_bedrooms"
          label="Min Bedrooms"
          value={draft.minimum_bedrooms ? String(draft.minimum_bedrooms) : ''}
          onChange={(value) => handleChange('minimum_bedrooms', numberValue(value))}
          options={[
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' },
          ]}
        />

        <Select
          id="more_minimum_bathrooms"
          label="Min Bathrooms"
          value={draft.minimum_bathrooms ? String(draft.minimum_bathrooms) : ''}
          onChange={(value) => handleChange('minimum_bathrooms', numberValue(value))}
          options={[
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
          ]}
        />

        <Select
          id="more_is_furnished"
          label="Furnished"
          value={draft.is_furnished ? 'true' : ''}
          onChange={(value) => handleChange('is_furnished', value === 'true')}
          options={booleanOptions}
        />

        <Select
          id="more_is_featured"
          label="Featured Only"
          value={draft.is_featured ? 'true' : ''}
          onChange={(value) => handleChange('is_featured', value === 'true')}
          options={booleanOptions}
        />
      </div>
    </Modal>
  )
}
