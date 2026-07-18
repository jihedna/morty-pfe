export interface ExpenseCategory {
  label: string
  value: number
  color?: string
}

interface ExpenseBreakdownChartProps {
  categories?: ExpenseCategory[]
  total?: number
}

export function ExpenseBreakdownChart({ categories, total }: ExpenseBreakdownChartProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6" role="status" aria-live="polite">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Monthly Expense Breakdown</h3>
        <p className="text-sm text-navy-500">No expense data available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Monthly Expense Breakdown</h3>
      <p className="text-sm text-navy-500">Total: {total !== undefined ? total : 'N/A'}</p>
      <ul className="mt-3 space-y-2">
        {categories.map((cat, i) => (
          <li key={i} className="text-sm text-navy-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#b5000b' }} />
            <span>{cat.label}</span>
            <span className="ml-auto font-semibold">{cat.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
