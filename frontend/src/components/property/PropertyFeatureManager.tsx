import { useState } from 'react'
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
  const availableFeatures = FEATURE_OPTIONS.filter(
    (opt) => !existingFeatures.includes(opt.value)
  )

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to add feature')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveFeature = async (featureId: string) => {
    try {
      await propertyFeaturesApi.deleteFeature(propertyId, featureId)
      onFeaturesChange()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to remove feature')
    }
  }

  const getFeatureLabel = (featureValue: string) => {
    const option = FEATURE_OPTIONS.find((opt) => opt.value === featureValue)
    return option?.label || featureValue
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Property Features</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}

      {/* Add Feature Form */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h4 className="font-medium">Add Feature</h4>
        <form onSubmit={handleAddFeature} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="feature-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Feature
            </label>
            <select
              id="feature-select"
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a feature...</option>
              {availableFeatures.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAdding || availableFeatures.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Features List */}
      {features.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-medium mb-3">Current Features</h4>
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
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
          No features added yet
        </div>
      )}
    </div>
  )
}
