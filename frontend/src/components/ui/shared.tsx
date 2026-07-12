import React from 'react'

// ─── PageHeader ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  href?: string
  trend?: { value: number; isPositive: boolean; label?: string }
}

export function MetricCard({ title, value, icon, iconBg = 'bg-primary-100', iconColor = 'text-primary-600', href, trend }: MetricCardProps) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 flex items-center gap-4 transition-shadow hover:shadow-card-hover">
      {icon && (
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-navy-900 mt-0.5">{value}</p>
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.isPositive ? 'text-success-600' : 'text-accent-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label || 'from last month'}
          </p>
        )}
      </div>
    </div>
  )
  if (href) {
    return (
      <a href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
        {inner}
      </a>
    )
  }
  return inner
}

// ─── LoadingState ─────────────────────────────────────────────────────────────
interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading…', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 gap-3 ${className}`} aria-live="polite" aria-busy="true">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`} role="alert" aria-live="assertive">
      <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center" aria-hidden="true">
        <svg className="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">Error</p>
        <p className="text-sm text-gray-500 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-3 text-center ${className}`} role="status" aria-live="polite">
      {icon ? (
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center" aria-hidden="true">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <div>
        <p className="text-base font-semibold text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-card ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
  )
}

// ─── PageContainer ────────────────────────────────────────────────────────────
interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  )
}

// ─── DataTable ────────────────────────────────────────────────────────────────
interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string | number
  isLoading?: boolean
  loadingMessage?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  className?: string
}

export function DataTable<T>({ columns, rows, keyExtractor, isLoading, loadingMessage = 'Loading…', emptyTitle = 'No data', emptyDescription, emptyAction, className = '' }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card className="py-4">
        <LoadingState message={loadingMessage} />
      </Card>
    )
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </Card>
    )
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-x-auto ${className}`}>
      <table className="w-full min-w-full text-left">
        <thead className="bg-surface-muted border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={keyExtractor(row)} className="even:bg-surface-muted/50 hover:bg-navy-50/60 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 text-sm text-gray-900 whitespace-nowrap ${col.className || ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── FilterPanel ───────────────────────────────────────────────────────────────
interface FilterPanelProps {
  title?: string
  children: React.ReactNode
  onClear?: () => void
  hasFilters?: boolean
  className?: string
}

export function FilterPanel({ title = 'Filters', children, onClear, hasFilters = false, className = '' }: FilterPanelProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {hasFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export function ActionButton({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  className = '',
  ...props
}: ActionButtonProps) {
  const base = 'inline-flex min-h-10 items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
    secondary: 'bg-navy-800 text-white hover:bg-navy-700',
    danger: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
    ghost: 'text-navy-700 hover:bg-navy-50',
    outline: 'bg-white border border-slate-200 text-navy-800 hover:bg-navy-50 hover:border-slate-300',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
