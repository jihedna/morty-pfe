export interface EquityProjectionPoint {
  year: number
  propertyValue: number
  loanBalance: number
  equity: number
}

interface EquityProjectionChartProps {
  data?: EquityProjectionPoint[]
}

export function EquityProjectionChart({ data }: EquityProjectionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6" role="status" aria-live="polite">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">10-Year Equity Growth</h3>
        <p className="text-sm text-navy-500">No projection data available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">10-Year Equity Growth</h3>
      <p className="text-sm text-navy-500">Equity projection data not supported by the current API.</p>
    </div>
  )
}
