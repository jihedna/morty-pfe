import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import LoadingState from '../../components/ui/LoadingState'
import ErrorAlert from '../../components/ui/ErrorAlert'
import { PropertyGallery } from '../../components/property/PropertyGallery'
import { PropertyStats } from '../../components/property/PropertyStats'
import { PropertyDescription } from '../../components/property/PropertyDescription'
import { PropertyFeatures } from '../../components/property/PropertyFeatures'
import { PropertyLocationMap } from '../../components/property/PropertyLocationMap'
import { clientDealsApi } from '../../lib/clientDealsApi'
import type { PropertyResponse } from '../../lib/agentPropertiesApi'
import { extractApiError } from '../../utils/format'
import type { PropertyFeature } from '../../types/property'

export default function ClientDealProperty() {
  const { contractId } = useParams<{ contractId: string }>()
  const [property, setProperty] = useState<PropertyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contractId) return
    setLoading(true)
    clientDealsApi.getDealProperty(contractId)
      .then(setProperty)
      .catch((err) => setError(extractApiError(err) || 'Failed to load deal property'))
      .finally(() => setLoading(false))
  }, [contractId])

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Read-only deal record</p><h1 className="mt-1 text-2xl font-semibold text-navy-900">{property?.title || 'Deal Property'}</h1><p className="mt-1 text-sm text-slate-500">This closed property can be viewed but cannot be requested, booked, registered, or modified.</p></div>
          <Button as="Link" to="/client/deals" variant="outline">Back to My Deals</Button>
        </div>
        {loading ? <LoadingState message="Loading deal property…" /> : error ? <ErrorAlert message={error} /> : property ? (
          <>
            <PropertyGallery images={property.images} title={property.title} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium capitalize text-primary-700">{property.listing_type} · {property.property_type}</p><h2 className="mt-1 text-3xl font-semibold text-navy-900">{property.title}</h2><p className="mt-2 text-slate-500">{[property.address_line, property.district, property.city, property.governorate].filter(Boolean).join(', ')}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-700">{property.status}</span></div></Card>
                <PropertyStats areaSqm={property.area_sqm} bedrooms={property.bedrooms} bathrooms={property.bathrooms} rooms={property.rooms} />
                <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold text-navy-900">Description</h2><PropertyDescription description={property.description} /></Card>
                <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold text-navy-900">Features</h2><PropertyFeatures features={property.features as unknown as PropertyFeature[]} /></Card>
                {property.latitude && property.longitude && <Card className="space-y-4 p-6"><h2 className="text-xl font-semibold text-navy-900">Location</h2><PropertyLocationMap latitude={property.latitude} longitude={property.longitude} title={property.title} /></Card>}
              </div>
              <aside><Card className="sticky top-4 space-y-4 p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Closed agreement</p><p className="text-3xl font-semibold text-navy-900">{property.currency} {Number(property.price).toLocaleString()}</p><div className="rounded-xl bg-success-50 p-4 text-sm leading-6 text-success-700">This page is for viewing your completed deal only. All property actions are disabled.</div><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Reference</dt><dd className="font-medium text-navy-900">{property.reference_code}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize text-navy-900">{property.status}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Furnished</dt><dd className="font-medium text-navy-900">{property.is_furnished ? 'Yes' : 'No'}</dd></div></dl></Card></aside>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
