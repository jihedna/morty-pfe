interface RiskListProps {
  risks: string[]
}

export function RiskList({ risks }: RiskListProps) {
  if (!risks || risks.length === 0) return null
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-navy-900 mb-2">Risques identifiés</h3>
      <ul className="space-y-1">
        {risks.map((risk, i) => (
          <li key={i} className="text-sm text-navy-700 flex gap-2">
            <span className="text-warning-500 flex-shrink-0" aria-hidden="true">•</span>
            {risk}
          </li>
        ))}
      </ul>
    </div>
  )
}
