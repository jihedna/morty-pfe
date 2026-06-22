interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div
      style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #dc2626',
        borderRadius: '4px',
        padding: '1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#dc2626' }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            fontSize: '1.25rem',
            cursor: 'pointer',
            marginLeft: '1rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
