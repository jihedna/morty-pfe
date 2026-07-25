import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginData } from '../lib/authApi'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ErrorAlert from '../components/ui/ErrorAlert'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const credentials: LoginData = { email, password }
      const user = await login(credentials)
      const role = user.role
      if (role === 'manager') {
        navigate('/admin/dashboard')
      } else if (role === 'agent') {
        navigate('/agent/dashboard')
      } else {
        navigate('/client/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your RE/MAX Smile AI account."
      testId="login-page"
    >
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-6" />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          label="Email Address"
          required
          autoComplete="email"
          placeholder="agent@remax.com"
        />
        <Input
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          label="Password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
          {isLoading ? 'Signing in' : 'Continue with Email'}
        </Button>
      </form>

    </AuthLayout>
  )
}
