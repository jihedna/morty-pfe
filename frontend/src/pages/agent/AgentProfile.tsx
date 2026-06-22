import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { agentApi, AgentResponse, AgentSelfUpdate } from '../../lib/agentApi'
import { extractApiError } from '../../utils/format'

export default function AgentProfile() {
  const [profile, setProfile] = useState<AgentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<AgentSelfUpdate>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await agentApi.getMyProfile()
      setProfile(data)
      setFormData({
        phone: data.phone,
        biography: data.biography || undefined,
        languages: data.languages || undefined,
        availability_status: data.availability_status as 'available' | 'busy' | 'unavailable',
      })
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AgentSelfUpdate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value || undefined }))
    setHasUnsavedChanges(true)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await agentApi.updateMyProfile(formData)
      setSuccess(true)
      setHasUnsavedChanges(false)
      // Reload profile to get updated data
      await loadProfile()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (profile) {
      setFormData({
        phone: profile.phone,
        biography: profile.biography || undefined,
        languages: profile.languages || undefined,
        availability_status: profile.availability_status as 'available' | 'busy' | 'unavailable',
      })
      setHasUnsavedChanges(false)
      setError(null)
      setSuccess(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Agent Profile</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Profile updated successfully
          </div>
        )}

        {profile && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Contact Information</h2>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">
                  Languages
                </label>
                <input
                  type="text"
                  id="languages"
                  value={formData.languages || ''}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={500}
                  placeholder="e.g., English, French, Arabic"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Professional Information</h2>

              <div>
                <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-1">
                  Biography
                </label>
                <textarea
                  id="biography"
                  value={formData.biography || ''}
                  onChange={(e) => handleInputChange('biography', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={2000}
                  placeholder="Tell clients about yourself and your expertise"
                />
              </div>

              <div>
                <label htmlFor="availability_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Status
                </label>
                <select
                  id="availability_status"
                  value={formData.availability_status || 'available'}
                  onChange={(e) => handleInputChange('availability_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold">Read-Only Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
                  <p className="text-gray-900">{profile.office}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <p className="text-gray-900">{profile.years_experience}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Budget</label>
                  <p className="text-gray-900">{profile.minimum_budget} TND</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Budget</label>
                  <p className="text-gray-900">{profile.maximum_budget} TND</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success Rate</label>
                  <p className="text-gray-900">{(profile.success_rate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closed Deals</label>
                  <p className="text-gray-900">{profile.closed_deals}</p>
                </div>
              </div>

              {profile.territories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Territories</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.territories.map((territory) => (
                      <span
                        key={territory.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {territory.territory}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.property_types.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Types</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.property_types.map((pt) => (
                      <span
                        key={pt.id}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {pt.property_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
