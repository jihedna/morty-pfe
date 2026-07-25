import { useState } from 'react'
import { mlApi, type PriceEstimationResponse } from '../../lib/mlApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PageContainer } from '../../components/ui/shared'
import AppLayout from '../../components/layout/AppLayout'

export default function PriceEstimationPage() {
  const [form, setForm] = useState({
    listing_type: 'sale' as 'sale' | 'rent',
    city: '',
    district: '',
    property_type: 'apartment',
    area_sqm: 100,
    bedrooms: 2,
    bathrooms: 1,
  })
  const [result, setResult] = useState<PriceEstimationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await mlApi.estimatePrice({
        listing_type: form.listing_type,
        city: form.city,
        district: form.district || undefined,
        property_type: form.property_type,
        area_sqm: Number(form.area_sqm),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate price')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TND', minimumFractionDigits: 0 }).format(val)

  return (
    <AppLayout>
    <PageContainer className="max-w-6xl py-0">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-slate-900">Price Estimation Tool</h1>
        <p className="mt-1 text-sm text-slate-500">
          Get an estimated listing price based on comparable property data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 shadow-card-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Listing Type"
              value={form.listing_type}
              onChange={(val) => setForm({ ...form, listing_type: val as 'sale' | 'rent' })}
              options={[
                { value: 'sale', label: 'For Sale' },
                { value: 'rent', label: 'For Rent' },
              ]}
            />
            <Input
              label="City"
              value={form.city}
              onChange={(val) => setForm({ ...form, city: val })}
              placeholder="e.g. Tunis"
              required
            />
            <Input
              label="District (optional)"
              value={form.district}
              onChange={(val) => setForm({ ...form, district: val })}
              placeholder="e.g. Lac 1"
            />
            <Select
              label="Property Type"
              value={form.property_type}
              onChange={(val) => setForm({ ...form, property_type: val })}
              options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'house', label: 'House' },
                { value: 'villa', label: 'Villa' },
                { value: 'land', label: 'Land' },
                { value: 'terrain', label: 'Terrain' },
              ]}
            />
            <Input
              label="Area (m²)"
              type="number"
              value={String(form.area_sqm)}
              onChange={(val) => setForm({ ...form, area_sqm: Number(val) })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bedrooms"
                type="number"
                value={String(form.bedrooms)}
                onChange={(val) => setForm({ ...form, bedrooms: Number(val) })}
              />
              <Input
                label="Bathrooms"
                type="number"
                value={String(form.bathrooms)}
                onChange={(val) => setForm({ ...form, bathrooms: Number(val) })}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Estimating...' : 'Estimate Price'}
            </Button>
          </form>
        </Card>

        <div>
          {error && (
            <Card className="border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </Card>
          )}
          {result && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Estimated Price</h2>
              <div className="mb-4">
                <p className="text-3xl font-bold text-blue-600">{formatPrice(result.estimate)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Range: {formatPrice(result.lower_estimate)} – {formatPrice(result.upper_estimate)}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reliability:</span>
                  <span className="font-medium capitalize">{result.reliability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comparables:</span>
                  <span className="font-medium">{result.comparable_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="font-medium">{result.fallback ? 'Fallback' : 'ML Model'}</span>
                </div>
              </div>
              <p className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                ⚠️ {result.disclaimer}
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
    </AppLayout>
  )
}
