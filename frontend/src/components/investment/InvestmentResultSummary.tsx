import { InvestmentScoreResponse } from '../../lib/investmentApi'
import { InvestmentScoreGauge } from './InvestmentScoreGauge'
import { InvestmentGradeBadge } from './InvestmentGradeBadge'
import { InvestmentMetricCard } from './InvestmentMetricCard'
import { ScoreBreakdown } from './ScoreBreakdown'
import { RiskList } from './RiskList'
import { InvestmentMethodologyNotice } from './InvestmentMethodologyNotice'

interface InvestmentResultSummaryProps {
  result: InvestmentScoreResponse
}

function metricDescriptor(score: number) {
  if (score >= 70) return 'Fort'
  if (score >= 45) return 'Modéré'
  return 'Faible'
}

export function InvestmentResultSummary({ result }: InvestmentResultSummaryProps) {
  return (
    <div className="bg-surface-muted border border-slate-200/80 rounded-2xl shadow-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary-600" aria-hidden="true" />
      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-6">Niveau d&apos;investissement</h2>
        <InvestmentScoreGauge score={result.investment_score} />
        <div className="mt-5 space-y-2">
          <InvestmentGradeBadge score={result.investment_score} />
          <p className="text-sm text-navy-500 px-4">{result.recommendation}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <InvestmentMetricCard
          title="Rendement locatif"
          value={result.rental_yield_score.toFixed(0)}
          supportingText={metricDescriptor(result.rental_yield_score)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-navy-100"
          iconColor="text-primary-600"
        />
        <InvestmentMetricCard
          title="Demande"
          value={result.demand_score.toFixed(0)}
          supportingText={metricDescriptor(result.demand_score)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          iconBg="bg-navy-100"
          iconColor="text-tertiary"
        />
        <InvestmentMetricCard
          title="Croissance"
          value={result.growth_score.toFixed(0)}
          supportingText={metricDescriptor(result.growth_score)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-navy-100"
          iconColor="text-success-600"
        />
      </div>

      <p className="text-sm text-navy-600 mb-5">{result.explanation}</p>

      <ScoreBreakdown scores={result} />
      <RiskList risks={result.risks} />
      <InvestmentMethodologyNotice note={result.data_note} />
    </div>
  )
}
