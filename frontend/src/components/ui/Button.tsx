interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  isLoading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  onClick,
  type = 'button',
}: ButtonProps) {
  const baseStyles = {
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
  }

  const variantStyles = {
    primary: {
      backgroundColor: '#003366',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    danger: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
  }

  return (
    <button
      disabled={disabled || isLoading}
      onClick={onClick}
      type={type}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        opacity: disabled || isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
