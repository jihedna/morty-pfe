import { forwardRef } from 'react'

interface TextareaProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  maxLength?: number
  label?: string
  error?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  autoResize?: boolean
  maxHeight?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    rows = 4,
    maxLength,
    label,
    error,
    className = '',
    onKeyDown,
    autoResize = false,
    maxHeight = 120,
  },
  ref
) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-700">
          {label}
          {required && <span className="text-accent-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (autoResize) {
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-navy-700 disabled:bg-surface-muted disabled:cursor-not-allowed ${ 
          autoResize ? 'resize-none' : 'resize-y'
        } ${
          error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-slate-200 hover:border-slate-300'
        }`}
        style={autoResize ? { overflowY: 'auto', maxHeight: `${maxHeight}px` } : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-accent-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default Textarea
