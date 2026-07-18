interface ScoreBreakdownProps {
  scores: {
    demand_score: number
    affordability_score: number
    rental_yield_score: number
    growth_score: number
    liquidity_score: number
  }
}

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-success-500'
  if (score >= 45) return 'bg-warning-500'
  return 'bg-accent-500'
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(Math.max(value, 0), 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-navy-700">{label}</span>
        <span className="font-semibold text-navy-900">{value.toFixed(0)}</span>
      </div>
      <div className="w-full bg-navy-100 rounded-full h-2" aria-hidden="true">
        <div
          className={`h-2 rounded-full transition-all duration-500 motion-reduce:transition-none ${scoreBarColor(value)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy-900">Détail des scores</h3>
      <ScoreBar label="Demande" value={scores.demand_score} />
      <ScoreBar label="Accessibilité budget" value={scores.affordability_score} />
      <ScoreBar label="Rendement locatif" value={scores.rental_yield_score} />
      <ScoreBar label="Croissance des prix" value={scores.growth_score} />
      <ScoreBar label="Liquidité" value={scores.liquidity_score} />
    </div>
  )
}
