import { useMemo } from 'react'

interface InvestmentScoreGaugeProps {
  score: number
  label?: string
}

export function InvestmentScoreGauge({ score, label = 'Investment score' }: InvestmentScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const rotation = -180 + (clamped / 100) * 180

  const ariaLabel = useMemo(() => {
    return `${label}: ${clamped} out of 100`
  }, [label, clamped])

  return (
    <div className="relative flex flex-col items-center" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <div className="relative w-[200px] h-[100px] overflow-hidden">
        {/* Background semicircle */}
        <div className="absolute w-[200px] h-[200px] rounded-full border-[20px] border-navy-100" style={{ clipPath: 'inset(0 0 50% 0)' }} />
        {/* Fill semicircle */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full border-[20px] border-primary-600 transition-transform duration-1000 ease-out motion-reduce:transition-none"
          style={{
            clipPath: 'inset(0 0 50% 0)',
            transform: `rotate(${rotation}deg)`,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-3xl font-bold text-primary-600">{clamped}</span>
          <span className="text-xs text-navy-500 font-medium uppercase tracking-widest">Points</span>
        </div>
      </div>
      <span className="sr-only">{score} out of 100</span>
    </div>
  )
}
