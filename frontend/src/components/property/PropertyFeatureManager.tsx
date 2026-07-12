import { useState } from 'react'
import { Card, SectionHeader } from '../ui/shared'
import Select from '../ui/Select'
import Button from '../ui/Button'
import FormFieldError from '../common/FormFieldError'
import { propertyFeaturesApi } from '../../lib/propertyFeaturesApi'
import { PropertyFeatureResponse } from '../../lib/agentPropertiesApi'
import { extractApiError } from '../../utils/format'

interface PropertyFeatureManagerProps {
  propertyId: string
  features: PropertyFeatureResponse[]
  onFeaturesChange: () => void
}

const FEATURE_OPTIONS = [
  { value: 'parking', label: 'Parking' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'garden', label: 'Garden' },
  { value: 'pool', label: 'Pool' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'central_heating', label: 'Central Heating' },
  { value: 'security_system', label: 'Security System' },
  { value: 'sea_view', label: 'Sea View' },
  { value: 'storage_room', label: 'Storage Room' },
  { value: 'accessible_entry', label: 'Accessible Entry' },
]

export default function PropertyFeatureManager({
  propertyId,
  features,
  onFeaturesChange,
}: PropertyFeatureManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFeature, setSelectedFeature] = useState('')

  const existingFeatures = features.map((f) => f.feature)
  const availableFeatures = FEATURE_OPTIONS.filter((opt) => !existingFeatures.includes(opt.value))

  const handleAddFeature = async () => {
    if (!selectedFeature) {
      setError('Please select a feature to add')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      await propertyFeaturesApi.addFeature(propertyId, selectedFeature)
      setSelectedFeature('')
      onFeaturesChange()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to add feature')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveFeature = async (featureId: string) => {
    try {
      await propertyFeaturesApi.deleteFeature(propertyId, featureId)
      onFeaturesChange()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to remove feature')
    }
  }

  const getFeatureLabel = (featureValue: string) => {
    const option = FEATURE_OPTIONS.find((opt) => opt.value === featureValue)
    return option?.label || featureValue
  }

  return (
    <Card>
      <SectionHeader title="Property Features" />
      <FormFieldError message={error} />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            id="feature-select"
            label="Add Feature"
            value={selectedFeature}
            onChange={setSelectedFeature}
            options={availableFeatures}
            placeholder="Choose a feature..."
            className="flex-1"
          />
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddFeature}
              isLoading={isAdding}
              disabled={isAdding || availableFeatures.length === 0 || !selectedFeature}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {features.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Current Features</h4>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-full"
              >
                <span>{getFeatureLabel(feature.feature)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(feature.id)}
                  className="text-green-700 hover:text-green-900 font-bold"
                  aria-label={`Remove ${getFeatureLabel(feature.feature)}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No features added yet</div>
      )}
    </Card>
  )
}
