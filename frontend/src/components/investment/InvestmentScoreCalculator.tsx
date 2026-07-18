import { useState, useCallback } from 'react'
import { investmentApi, InvestmentScoreRequest, InvestmentScoreResponse } from '../../lib/investmentApi'
import { extractApiError } from '../../utils/format'
import { PageHeader } from '../ui/shared'
import { InvestmentParametersForm } from './InvestmentParametersForm'
import { InvestmentResultSummary } from './InvestmentResultSummary'

const INITIAL_FORM: InvestmentScoreRequest = {
  city: '',
  district: '',
  budget: 0,
  property_type: 'apartment',
  listing_type: 'sale',
  investment_goal: 'rental_income',
}

export function InvestmentScoreCalculator() {
  const [form, setForm] = useState<InvestmentScoreRequest>(INITIAL_FORM)
  const [result, setResult] = useState<InvestmentScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [form])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Score d'Investissement"
        subtitle="Analyse basée sur les données de marché. Les résultats sont indicatifs et ne constituent pas un conseil financier."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <InvestmentParametersForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <div className="lg:col-span-8">
          {result ? (
            <InvestmentResultSummary result={result} />
          ) : (
            <div className="bg-surface-muted border border-slate-200/80 rounded-2xl shadow-card p-6 h-full flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-semibold text-navy-900">Résultat</p>
                <p className="text-sm text-navy-500 mt-1">
                  Renseignez les paramètres et cliquez sur Calculer pour obtenir le score.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
