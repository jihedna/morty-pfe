import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { PageHeader, Card, SectionHeader, LoadingState, ErrorState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { agentApi, AgentResponse, AgentSelfUpdate } from '../../lib/agentApi'
import { extractApiError, normalizeValidationError } from '../../utils/format'

const availabilityOptions = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
]

export default function AgentProfile() {
  const [profile, setProfile] = useState<AgentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<AgentSelfUpdate>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const data = await agentApi.getMyProfile()
      setProfile(data)
      setFormData({
        phone: data.phone,
        biography: data.biography || undefined,
        languages: data.languages || undefined,
        availability_status: data.availability_status as 'available' | 'busy' | 'unavailable',
      })
      setHasUnsavedChanges(false)
      setSuccess(false)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AgentSelfUpdate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || undefined }))
    setHasUnsavedChanges(true)
    setSuccess(false)
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.phone || formData.phone.trim().length === 0) {
      errors.phone = 'Phone number is required'
    } else if (formData.phone.trim().length > 20) {
      errors.phone = 'Phone number must be 20 characters or less'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!validate()) return

    setIsSaving(true)
    try {
      await agentApi.updateMyProfile(formData)
      setSuccess(true)
      setHasUnsavedChanges(false)
      await loadProfile()
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
        setError(validation.detail?.join(', ') || extractApiError(err) || 'Failed to update profile')
      }
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
      setFieldErrors({})
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message="Loading profile…" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <PageHeader title="Agent Profile" subtitle="Keep your public details and availability up to date" />

        {error && <ErrorState message={error} onRetry={loadProfile} />}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-2xl" role="status" aria-live="polite">
            Profile updated successfully
          </div>
        )}

        {profile && (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
            <Card className="h-fit">
              <SectionHeader title="Contact Information" />
              <div className="space-y-4">
                <Input
                  id="phone"
                  type="tel"
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={(value) => handleInputChange('phone', value)}
                  error={fieldErrors.phone}
                  required
                  maxLength={20}
                />
                <Input
                  id="languages"
                  label="Languages"
                  value={formData.languages || ''}
                  onChange={(value) => handleInputChange('languages', value)}
                  error={fieldErrors.languages}
                  maxLength={500}
                  placeholder="e.g., English, French, Arabic"
                />
              </div>
            </Card>

            <Card className="h-fit">
              <SectionHeader title="Professional Information" />
              <div className="space-y-4">
                <Textarea
                  id="biography"
                  label="Biography"
                  value={formData.biography || ''}
                  onChange={(value) => handleInputChange('biography', value)}
                  error={fieldErrors.biography}
                  maxLength={2000}
                  placeholder="Tell clients about yourself and your expertise"
                />
                <Select
                  id="availability_status"
                  label="Availability Status"
                  value={formData.availability_status || 'available'}
                  onChange={(value) => handleInputChange('availability_status', value)}
                  options={availabilityOptions}
                />
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <SectionHeader title="Read-Only Information" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
                  <p className="text-gray-900">{profile.office}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <p className="text-gray-900">{profile.years_experience}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Budget</label>
                  <p className="text-gray-900">{profile.minimum_budget.toLocaleString()} TND</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Budget</label>
                  <p className="text-gray-900">{profile.maximum_budget.toLocaleString()} TND</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success Rate</label>
                  <p className="text-gray-900">{(profile.success_rate * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closed Deals</label>
                  <p className="text-gray-900">{profile.closed_deals}</p>
                </div>
              </div>

              {profile.territories && profile.territories.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Territories</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.territories.map((territory) => (
                      <span key={territory.id} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                        {territory.territory}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.property_types && profile.property_types.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Types</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.property_types.map((pt) => (
                      <span key={pt.id} className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-sm">
                        {pt.property_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="sticky bottom-4 z-10 flex gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-card-hover backdrop-blur lg:col-span-2">
              <Button type="submit" disabled={isSaving || !hasUnsavedChanges} isLoading={isSaving}>
                Save Changes
              </Button>
              {hasUnsavedChanges && (
                <Button type="button" variant="secondary" onClick={handleDiscard}>
                  Discard Changes
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
