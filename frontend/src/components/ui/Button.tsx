import { Link } from 'react-router-dom'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  children?: React.ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  ariaLabel?: string
  as?: 'button' | 'a' | 'Link'
  href?: string
  to?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  as = 'button',
  href,
  to,
}: ButtonProps) {
  const baseStyles = 'inline-flex min-h-10 items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed' 

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
    secondary: 'bg-navy-800 text-white hover:bg-navy-700',
    danger: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
    ghost: 'bg-transparent text-navy-700 hover:bg-navy-50',
    outline: 'bg-white border border-slate-200 text-navy-800 hover:bg-navy-50 hover:border-slate-300',
  }

  const classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`

  if (as === 'a') {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </a>
    )
  }

  if (as === 'Link') {
    return (
      <Link
        to={to || '/'}
        onClick={onClick}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      onClick={onClick}
      type={type}
      aria-label={ariaLabel}
      className={classes}
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
