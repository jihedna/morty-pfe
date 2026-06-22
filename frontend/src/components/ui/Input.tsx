interface InputProps {
  id?: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  minLength?: number
  maxLength?: number
  label?: string
  error?: string
}

export default function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  minLength,
  maxLength,
  label,
  error,
}: InputProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: '0.25rem',
            fontWeight: '500',
          }}
        >
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: error ? '1px solid #dc2626' : '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '1rem',
        }}
      />
      {error && (
        <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  )
}
