import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { RegisterData } from '../lib/authApi'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ErrorAlert from '../components/ui/ErrorAlert'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one digit'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate name fields
    if (firstName.length < 1 || firstName.length > 100) {
      setError('First name must be between 1 and 100 characters')
      return
    }

    if (lastName.length < 1 || lastName.length > 100) {
      setError('Last name must be between 1 and 100 characters')
      return
    }

    setIsLoading(true)

    try {
      const data: RegisterData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }
      await register(data)
      navigate('/client/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your journey with RE/MAX Smile AI."
      testId="register-page"
    >
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-6" />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            value={firstName}
            onChange={setFirstName}
            label="First Name"
            required
            minLength={1}
            maxLength={100}
            autoComplete="given-name"
            placeholder="John"
          />
          <Input
            id="lastName"
            value={lastName}
            onChange={setLastName}
            label="Last Name"
            required
            minLength={1}
            maxLength={100}
            autoComplete="family-name"
            placeholder="Doe"
          />
        </div>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          label="Email Address"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Input
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          label="Password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Min. 8 characters"
        />
        <p className="text-xs text-navy-500">Min. 8 characters with uppercase, lowercase and a number</p>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          label="Confirm password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
          {isLoading ? 'Creating account' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
