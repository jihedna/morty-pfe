import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    // Redirect authenticated users to their dashboard based on role
    switch (user.role) {
      case 'client':
        return <Navigate to="/client/dashboard" replace />
      case 'agent':
        return <Navigate to="/agent/dashboard" replace />
      case 'manager':
        return <Navigate to="/admin/dashboard" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
