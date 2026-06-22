interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          opacity: 0.5,
        }}
      >
        📭
      </div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>
        {title}
      </h2>
      {description && (
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{description}</p>
      )}
      {action}
    </div>
  )
}
