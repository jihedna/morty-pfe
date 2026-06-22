interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '0.25rem', color: '#333' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: '#666', margin: 0 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
