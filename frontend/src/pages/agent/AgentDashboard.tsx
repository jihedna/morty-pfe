import { useAuth } from '../../contexts/AuthContext'

export default function AgentDashboard() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Agent Dashboard</h1>
      <p>Welcome, {user?.first_name}!</p>
      <p>Agent dashboard (Coming Soon)</p>
    </div>
  )
}
