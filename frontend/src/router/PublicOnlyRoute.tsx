import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
