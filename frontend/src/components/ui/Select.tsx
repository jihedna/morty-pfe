interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  label?: string
  ariaLabel?: string
  error?: string
  className?: string
}

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  label,
  ariaLabel,
  error,
  className = '',
}: SelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-700">
          {label}
          {required && <span className="text-accent-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full min-h-10 px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-navy-700 disabled:bg-surface-muted disabled:cursor-not-allowed ${ 
          error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-accent-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
