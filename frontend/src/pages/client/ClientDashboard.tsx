import { useAuth } from '../../contexts/AuthContext'

export default function ClientDashboard() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Client Dashboard</h1>
      <p>Welcome, {user?.first_name}!</p>
      <p>Client dashboard (Coming Soon)</p>
    </div>
  )
}
