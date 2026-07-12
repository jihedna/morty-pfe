import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue" testId="login-page">
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-6" />}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          label="Email address"
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
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
          {isLoading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:underline">
          Create account
        </Link>
      </p>

      <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
        <p className="text-xs font-semibold text-primary-700 mb-2 uppercase tracking-wide">Demo accounts</p>
        <div className="space-y-1 text-xs text-primary-600">
          <p>Manager: manager@remax.tn / Manager123</p>
          <p>Agent: agent1@remax.tn / Agent123</p>
          <p>Client: client1@gmail.com / Client123</p>
        </div>
      </div>
    </AuthLayout>
  )
}
