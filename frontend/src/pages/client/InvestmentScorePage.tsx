import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { investmentApi, InvestmentScoreRequest, InvestmentScoreResponse } from '../../lib/investmentApi'
import { extractApiError } from '../../utils/format'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card, PageHeader } from '../../components/ui/shared'

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

function scoreColor(score: number) {
  if (score >= 70) return 'text-success-500'
  if (score >= 45) return 'text-warning-500'
  return 'text-accent-500'
}

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-success-500'
  if (score >= 45) return 'bg-warning-500'
  return 'bg-accent-500'
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(score, 100)
  const colorClass = scoreColor(score)
  return (
    <div className="relative flex flex-col items-center">
      <svg width={160} height={90} viewBox="0 0 160 90" className={colorClass}>
        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#e5e7eb" strokeWidth={14} strokeLinecap="round" />
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="currentColor"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 204} 204`}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className={`text-3xl font-bold ${colorClass}`}>{score}</p>
        <p className="text-xs text-gray-500">/ 100</p>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, score }: { label: string; value: number; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">{value.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function InvestmentScorePage() {
  const [form, setForm] = useState<InvestmentScoreRequest>({
    city: '',
    district: '',
    budget: 0,
    property_type: 'apartment',
    listing_type: 'sale',
    investment_goal: 'rental_income',
  })
  const [result, setResult] = useState<InvestmentScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAreaChange = (value: string) => {
    const found = GRAND_TUNIS_AREAS.find(a => `${a.city}|${a.district}` === value)
    if (found) setForm(f => ({ ...f, city: found.city, district: found.district }))
    else setForm(f => ({ ...f, city: value, district: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.city || form.budget <= 0) {
      setError('Veuillez renseigner la ville et le budget.')
      return
    }
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await investmentApi.getScore(form)
      setResult(res)
    } catch (err) {
      setError(extractApiError(err) || 'Erreur lors du calcul du score.')
    } finally {
      setIsLoading(false)
    }
  }

  const levelLabel = result
    ? result.investment_score >= 70
      ? { text: 'Forte opportunité', color: 'text-success-600', bg: 'bg-success-50 border-success-200' }
      : result.investment_score >= 45
      ? { text: 'Opportunité modérée', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200' }
      : { text: 'Risque élevé', color: 'text-accent-600', bg: 'bg-accent-50 border-accent-200' }
    : null

  const zoneValue = form.city && form.district ? `${form.city}|${form.district}` : ''

  const zoneOptions = GRAND_TUNIS_AREAS.map(a => ({
    value: `${a.city}|${a.district}`,
    label: `${a.city} — ${a.district}`,
  }))

  const propertyTypeOptions = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Terrain' },
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Score d'Investissement"
          subtitle="Analyse basée sur les données de marché. Les résultats sont indicatifs et ne constituent pas un conseil financier."
        />

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={v => setForm(f => ({ ...f, city: v }))}
                label="Ville (ou saisie libre)"
                placeholder="Ex: Tunis, La Marsa..."
              />
              <Input
                id="budget"
                type="number"
                value={form.budget ? String(form.budget) : ''}
                onChange={v => setForm(f => ({ ...f, budget: Number(v) }))}
                label="Budget (TND)"
                placeholder="Ex: 300000"
                min="0"
              />
              <Select
                id="propertyType"
                value={form.property_type}
                onChange={v => setForm(f => ({ ...f, property_type: v }))}
                label="Type de bien"
                options={propertyTypeOptions}
              />
              <Select
                id="goal"
                value={form.investment_goal || ''}
                onChange={v => setForm(f => ({ ...f, investment_goal: v }))}
                label="Objectif"
                options={goalOptions}
              />
              <Select
                id="listingType"
                value={form.listing_type}
                onChange={v => setForm(f => ({ ...f, listing_type: v }))}
                label="Transaction"
                options={listingTypeOptions}
              />
            </div>

            {error && <p className="text-sm text-accent-600" role="alert" aria-live="polite">{error}</p>}

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Calculer le score
            </Button>
          </form>
        </Card>

        {result && levelLabel && (
          <Card className={`border-2 ${levelLabel.bg}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ScoreGauge score={result.investment_score} />
              <div className="flex-1">
                <p className={`text-xl font-bold ${levelLabel.color} mb-1`}>{levelLabel.text}</p>
                <p className="text-sm text-gray-600 mb-3">{result.recommendation}</p>
                <p className="text-xs text-gray-500 italic">{result.explanation}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Détail des scores</h3>
              <ScoreBar label="Demande" value={result.demand_score} score={result.demand_score} />
              <ScoreBar label="Accessibilité budget" value={result.affordability_score} score={result.affordability_score} />
              <ScoreBar label="Rendement locatif" value={result.rental_yield_score} score={result.rental_yield_score} />
              <ScoreBar label="Croissance des prix" value={result.growth_score} score={result.growth_score} />
              <ScoreBar label="Liquidité" value={result.liquidity_score} score={result.liquidity_score} />
            </div>

            {result.risks.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Risques identifiés</h3>
                <ul className="space-y-1">
                  {result.risks.map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-warning-500 flex-shrink-0" aria-hidden="true">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs text-warning-700 bg-warning-50 rounded-2xl px-3 py-2">
              {result.data_note}
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
