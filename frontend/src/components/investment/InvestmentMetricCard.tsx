import React from 'react'

interface InvestmentMetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  supportingText?: string
  supportingColor?: string
}

export function InvestmentMetricCard({
  title,
  value,
  icon,
  iconBg = 'bg-navy-100',
  iconColor = 'text-primary-600',
  supportingText,
  supportingColor = 'text-navy-500',
}: InvestmentMetricCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide truncate">{title}</p>
          <p className="text-lg font-semibold text-navy-900 mt-0.5 truncate">{value}</p>
        </div>
      </div>
      {supportingText && (
        <span className={`text-xs font-semibold ${supportingColor} flex-shrink-0 ml-2`}>{supportingText}</span>
      )}
    </div>
  )
}
