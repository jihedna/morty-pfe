export interface ProjectionRow {
  year: number
  propertyValue: number
  loanBalance: number
  equity: number
  rentalIncome: number
  operatingExpenses: number
  netCashFlow: number
}

interface FinancialProjectionTableProps {
  rows?: ProjectionRow[]
}

export function FinancialProjectionTable({ rows }: FinancialProjectionTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6" role="status" aria-live="polite">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Year-by-Year Financial Projection</h3>
        <p className="text-sm text-navy-500">No projection data available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
      <div className="p-6 border-b border-slate-200/80 bg-surface-muted">
        <h3 className="text-lg font-semibold text-navy-900">Year-by-Year Financial Projection</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-6 py-4 font-bold text-navy-500">Year</th>
              <th className="px-6 py-4 font-bold text-navy-500">Property Value</th>
              <th className="px-6 py-4 font-bold text-navy-500">Loan Balance</th>
              <th className="px-6 py-4 font-bold text-navy-500">Equity</th>
              <th className="px-6 py-4 font-bold text-navy-500">Rental Income</th>
              <th className="px-6 py-4 font-bold text-navy-500">Net Cash Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={row.year} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-muted/50'}>
                <td className="px-6 py-4 font-medium text-navy-900">{row.year}</td>
                <td className="px-6 py-4 text-navy-700">{row.propertyValue}</td>
                <td className="px-6 py-4 text-navy-700">{row.loanBalance}</td>
                <td className="px-6 py-4 font-semibold text-primary-600">{row.equity}</td>
                <td className="px-6 py-4 text-navy-700">{row.rentalIncome}</td>
                <td className="px-6 py-4 text-navy-700">{row.netCashFlow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
