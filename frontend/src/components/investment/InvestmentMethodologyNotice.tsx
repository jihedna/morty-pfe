interface InvestmentMethodologyNoticeProps {
  note: string
}

export function InvestmentMethodologyNotice({ note }: InvestmentMethodologyNoticeProps) {
  return (
    <div className="mt-5 space-y-3">
      <p className="text-xs text-navy-600 bg-surface-muted rounded-2xl px-4 py-3 border border-slate-200/80">
        {note}
      </p>
      <p className="text-xs text-navy-500">
        Cette estimation est fournie à titre informatif et ne constitue pas un conseil financier. Les coûts réels, les rendements, les conditions de financement et la performance du marché peuvent varier.
      </p>
    </div>
  )
}
