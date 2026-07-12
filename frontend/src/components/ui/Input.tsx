import { useId } from 'react'

interface InputProps {
  id?: string
  type?: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  minLength?: number
  maxLength?: number
  min?: string
  max?: string
  step?: string
  label?: string
  error?: string
  autoComplete?: string
  className?: string
}

export default function Input({
  id: idProp,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  placeholder,
  required = false,
  disabled = false,
  minLength,
  maxLength,
  min,
  max,
  step,
  label,
  error,
  autoComplete,
  className = '',
}: InputProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-700">
          {label}
          {required && <span className="text-accent-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full min-h-10 px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-navy-700 disabled:bg-surface-muted disabled:cursor-not-allowed ${ 
          error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-slate-200 hover:border-slate-300'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-accent-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
