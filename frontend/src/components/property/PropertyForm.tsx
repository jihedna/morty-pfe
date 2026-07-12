import { Card, SectionHeader } from '../ui/shared'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import { PropertyAgentUpdate } from '../../lib/agentPropertiesApi'

interface PropertyFormProps {
  formData: PropertyAgentUpdate
  onChange: (field: keyof PropertyAgentUpdate, value: string | number | boolean | undefined) => void
  fieldErrors?: Record<string, string>
  disabled?: boolean
  status?: React.ReactNode
}

const propertyTypeOptions = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'office', label: 'Office' },
]

const listingTypeOptions = [
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' },
]

const currencyOptions = [
  { value: 'TND', label: 'TND' },
]

const initialStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
]

export default function PropertyForm({ formData, onChange, fieldErrors = {}, disabled = false, status }: PropertyFormProps) {
  const handleNumberChange = (field: keyof PropertyAgentUpdate, value: string, integer = false) => {
    if (value === '') {
      onChange(field, undefined)
    } else {
      onChange(field, integer ? parseInt(value, 10) : parseFloat(value))
    }
  }

  const handleTextChange = (field: keyof PropertyAgentUpdate, value: string) => {
    onChange(field, value === '' ? undefined : value)
  }

  return (
    <>
      <Card>
        <SectionHeader title="Basic Information" />
        <div className="space-y-4">
          <Input
            id="title"
            label="Title"
            value={formData.title || ''}
            onChange={(value) => handleTextChange('title', value)}
            error={fieldErrors.title}
            required
            maxLength={200}
            disabled={disabled}
          />
          <Textarea
            id="description"
            label="Description"
            value={formData.description || ''}
            onChange={(value) => handleTextChange('description', value)}
            error={fieldErrors.description}
            maxLength={5000}
            disabled={disabled}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Listing Information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            id="property_type"
            label="Property Type"
            value={formData.property_type || ''}
            onChange={(value) => handleTextChange('property_type', value)}
            options={propertyTypeOptions}
            error={fieldErrors.property_type}
            required
            disabled={disabled}
          />
          <Select
            id="listing_type"
            label="Listing Type"
            value={formData.listing_type || ''}
            onChange={(value) => handleTextChange('listing_type', value)}
            options={listingTypeOptions}
            error={fieldErrors.listing_type}
            required
            disabled={disabled}
          />
          {status ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center h-10">{status}</div>
            </div>
          ) : (
            <Select
              id="status"
              label="Status"
              value={formData.status || ''}
              onChange={(value) => handleTextChange('status', value)}
              options={initialStatusOptions}
              error={fieldErrors.status}
              required
              disabled={disabled}
            />
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Location" />
        <div className="space-y-4">
          <Input
            id="address_line"
            label="Address Line"
            value={formData.address_line || ''}
            onChange={(value) => handleTextChange('address_line', value)}
            error={fieldErrors.address_line}
            maxLength={300}
            disabled={disabled}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              id="city"
              label="City"
              value={formData.city || ''}
              onChange={(value) => handleTextChange('city', value)}
              error={fieldErrors.city}
              maxLength={100}
              disabled={disabled}
            />
            <Input
              id="district"
              label="District"
              value={formData.district || ''}
              onChange={(value) => handleTextChange('district', value)}
              error={fieldErrors.district}
              maxLength={100}
              disabled={disabled}
            />
            <Input
              id="governorate"
              label="Governorate"
              value={formData.governorate || ''}
              onChange={(value) => handleTextChange('governorate', value)}
              error={fieldErrors.governorate}
              maxLength={100}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              id="postal_code"
              label="Postal Code"
              value={formData.postal_code || ''}
              onChange={(value) => handleTextChange('postal_code', value)}
              error={fieldErrors.postal_code}
              maxLength={20}
              disabled={disabled}
            />
            <Input
              id="latitude"
              type="number"
              label="Latitude"
              value={String(formData.latitude ?? '')}
              onChange={(value) => handleNumberChange('latitude', value)}
              error={fieldErrors.latitude}
              min="-90"
              max="90"
              step="0.000001"
              disabled={disabled}
            />
            <Input
              id="longitude"
              type="number"
              label="Longitude"
              value={String(formData.longitude ?? '')}
              onChange={(value) => handleNumberChange('longitude', value)}
              error={fieldErrors.longitude}
              min="-180"
              max="180"
              step="0.000001"
              disabled={disabled}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Price" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="price"
            type="number"
            label="Price"
            value={String(formData.price ?? '')}
            onChange={(value) => handleNumberChange('price', value)}
            error={fieldErrors.price}
            required
            min="0"
            step="0.01"
            disabled={disabled}
          />
          <Select
            id="currency"
            label="Currency"
            value={formData.currency || 'TND'}
            onChange={(value) => handleTextChange('currency', value)}
            options={currencyOptions}
            error={fieldErrors.currency}
            disabled={disabled}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Dimensions" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="area_sqm"
            type="number"
            label="Area (sqm)"
            value={String(formData.area_sqm ?? '')}
            onChange={(value) => handleNumberChange('area_sqm', value)}
            error={fieldErrors.area_sqm}
            required
            min="0"
            step="0.01"
            disabled={disabled}
          />
          <Input
            id="land_area_sqm"
            type="number"
            label="Land Area (sqm)"
            value={String(formData.land_area_sqm ?? '')}
            onChange={(value) => handleNumberChange('land_area_sqm', value)}
            error={fieldErrors.land_area_sqm}
            min="0"
            step="0.01"
            disabled={disabled}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Rooms" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            id="rooms"
            type="number"
            label="Total Rooms"
            value={String(formData.rooms ?? '')}
            onChange={(value) => handleNumberChange('rooms', value, true)}
            error={fieldErrors.rooms}
            min="0"
            disabled={disabled}
          />
          <Input
            id="bedrooms"
            type="number"
            label="Bedrooms"
            value={String(formData.bedrooms ?? '')}
            onChange={(value) => handleNumberChange('bedrooms', value, true)}
            error={fieldErrors.bedrooms}
            min="0"
            disabled={disabled}
          />
          <Input
            id="bathrooms"
            type="number"
            label="Bathrooms"
            value={String(formData.bathrooms ?? '')}
            onChange={(value) => handleNumberChange('bathrooms', value, true)}
            error={fieldErrors.bathrooms}
            min="0"
            disabled={disabled}
          />
          <Input
            id="floor_number"
            type="number"
            label="Floor Number"
            value={String(formData.floor_number ?? '')}
            onChange={(value) => handleNumberChange('floor_number', value, true)}
            error={fieldErrors.floor_number}
            min="0"
            disabled={disabled}
          />
          <Input
            id="total_floors"
            type="number"
            label="Total Floors"
            value={String(formData.total_floors ?? '')}
            onChange={(value) => handleNumberChange('total_floors', value, true)}
            error={fieldErrors.total_floors}
            min="0"
            disabled={disabled}
          />
          <Input
            id="construction_year"
            type="number"
            label="Construction Year"
            value={String(formData.construction_year ?? '')}
            onChange={(value) => handleNumberChange('construction_year', value, true)}
            error={fieldErrors.construction_year}
            min="1800"
            max={new Date().getFullYear().toString()}
            disabled={disabled}
          />
          <div className="flex items-center pt-6">
            <input
              id="is_furnished"
              type="checkbox"
              checked={formData.is_furnished || false}
              onChange={(e) => onChange('is_furnished', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
            />
            <label htmlFor="is_furnished" className="ml-2 block text-sm text-gray-900">
              Furnished
            </label>
          </div>
        </div>
      </Card>
    </>
  )
}
