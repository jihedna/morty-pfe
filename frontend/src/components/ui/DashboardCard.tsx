interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function DashboardCard({ title, value, description, trend }: DashboardCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
        {value}
      </div>
      {description && (
        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          {description}
        </div>
      )}
      {trend && (
        <div
          style={{
            fontSize: '0.875rem',
            color: trend.isPositive ? '#10b981' : '#ef4444',
          }}
        >
          {trend.isPositive ? '+' : ''}{trend.value}% from last month
        </div>
      )}
    </div>
  )
}
