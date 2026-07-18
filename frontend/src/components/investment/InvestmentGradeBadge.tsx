import { useMemo } from 'react'

interface InvestmentGradeBadgeProps {
  score: number
}

export function InvestmentGradeBadge({ score }: InvestmentGradeBadgeProps) {
  const grade = useMemo(() => {
    if (score >= 70) {
      return { text: 'Forte opportunité', className: 'bg-success-100 text-success-700 border-success-200' }
    }
    if (score >= 45) {
      return { text: 'Opportunité modérée', className: 'bg-warning-100 text-warning-700 border-warning-200' }
    }
    return { text: 'Risque élevé', className: 'bg-accent-100 text-accent-700 border-accent-200' }
  }, [score])

  return (
    <span
      className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${grade.className}`}
      aria-label={`Grade: ${grade.text}`}
    >
      {grade.text.toUpperCase()}
    </span>
  )
}
