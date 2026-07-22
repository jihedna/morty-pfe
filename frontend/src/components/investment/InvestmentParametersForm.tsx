import { useMemo } from 'react'
import { InvestmentScoreRequest } from '../../lib/investmentApi'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

const GRAND_TUNIS_AREAS = [
  { city: 'Tunis', district: 'Lac 1' },
  { city: 'Tunis', district: 'Lac 2' },
  { city: 'La Marsa', district: 'La Marsa Centre' },
  { city: 'Carthage', district: 'Carthage Hannibal' },
  { city: 'Ariana', district: 'Ariana Centre' },
  { city: 'Ariana', district: 'Soukra' },
  { city: 'Ariana', district: 'Manzah' },
  { city: 'Tunis', district: 'Ain Zaghouan' },
  { city: 'Tunis', district: 'Tunis Centre' },
  { city: 'Ben Arous', district: 'Rades' },
]

interface InvestmentParametersFormProps {
  form: InvestmentScoreRequest
  onChange: (form: InvestmentScoreRequest) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: string | null
}

export function InvestmentParametersForm({ form, onChange, onSubmit, isLoading, error }: InvestmentParametersFormProps) {
  const zoneValue = form.city && form.district ? `${form.city}|${form.district}` : ''

  const zoneOptions = useMemo(() => {
    return GRAND_TUNIS_AREAS.map((a) => ({ value: `${a.city}|${a.district}`, label: `${a.city} — ${a.district}` }))
  }, [])

  const propertyTypeOptions = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Terrain' },
    { value: 'terrain', label: 'Terrain (zero-room listings)' },
    { value: 'commercial', label: 'Commercial' },
  ]

  const goalOptions = [
    { value: 'rental_income', label: 'Revenus locatifs' },
    { value: 'resale', label: 'Plus-value à la revente' },
    { value: 'family_home', label: 'Résidence principale' },
  ]

  const listingTypeOptions = [
    { value: 'sale', label: 'Achat' },
    { value: 'rent', label: 'Location' },
  ]

  const handleAreaChange = (value: string) => {
    const found = GRAND_TUNIS_AREAS.find((a) => `${a.city}|${a.district}` === value)
    if (found) {
      onChange({ ...form, city: found.city, district: found.district })
    } else {
      onChange({ ...form, city: value, district: '' })
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h2 className="text-lg font-semibold text-navy-900">Paramètres du bien</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-5" aria-label="Investment parameters form" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            id="zone"
            value={zoneValue}
            onChange={handleAreaChange}
            label="Zone (Grand Tunis)"
            placeholder="-- Sélectionner un quartier --"
            options={zoneOptions}
          />
          <Input
            id="city"
            value={form.city}
            onChange={(v) => onChange({ ...form, city: v })}
            label="Ville (ou saisie libre)"
            placeholder="Ex: Tunis, La Marsa..."
            required
            ariaLabel="Ville"
          />
          <Input
            id="budget"
            type="number"
            value={form.budget ? String(form.budget) : ''}
            onChange={(v) => onChange({ ...form, budget: Number(v) })}
            label="Budget (TND)"
            placeholder="Ex: 300000"
            min="0"
            required
            ariaLabel="Budget en TND"
          />
          <Select
            id="propertyType"
            value={form.property_type}
            onChange={(v) => onChange({ ...form, property_type: v })}
            label="Type de bien"
            options={propertyTypeOptions}
            required
          />
          <Select
            id="goal"
            value={form.investment_goal || ''}
            onChange={(v) => onChange({ ...form, investment_goal: v })}
            label="Objectif"
            options={goalOptions}
          />
          <Select
            id="listingType"
            value={form.listing_type || ''}
            onChange={(v) => onChange({ ...form, listing_type: v })}
            label="Transaction"
            options={listingTypeOptions}
          />
        </div>

        {error && (
          <p className="text-sm text-accent-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full" size="lg" ariaLabel="Calculer le score">
          Calculer le score
        </Button>
      </form>
    </div>
  )
}
