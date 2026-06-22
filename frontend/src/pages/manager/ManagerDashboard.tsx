import { useAuth } from '../../contexts/AuthContext'

export default function ManagerDashboard() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Manager Dashboard</h1>
      <p>Welcome, {user?.first_name}!</p>
      <p>Manager dashboard (Coming Soon)</p>
    </div>
  )
}
