import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginData } from '../lib/authApi'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
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
      await login(credentials)
      
      // Redirect based on role
      if (user) {
        switch (user.role) {
          case 'client':
            navigate('/client/dashboard')
            break
          case 'agent':
            navigate('/agent/dashboard')
            break
          case 'manager':
            navigate('/admin/dashboard')
            break
          default:
            navigate('/')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h1>Login</h1>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{ width: '100%', padding: '0.75rem', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
