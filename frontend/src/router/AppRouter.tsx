import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

// Public pages
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import PropertyListPage from '../pages/PropertyListPage'
import PropertyDetailPage from '../pages/PropertyDetailPage'

// Client pages
import ClientDashboard from '../pages/client/ClientDashboard'
import ConversationDetailPage from '../pages/client/ConversationDetailPage'
import FavoritesPage from '../pages/client/FavoritesPage'

// Agent pages
import AgentDashboard from '../pages/agent/AgentDashboard'
import AgentProfile from '../pages/agent/AgentProfile'
import AgentProperties from '../pages/agent/AgentProperties'
import PropertyCreate from '../pages/agent/PropertyCreate'
import PropertyEdit from '../pages/agent/PropertyEdit'
import AgentAppointments from '../pages/agent/AgentAppointments'
import AgentConversations from '../pages/agent/AgentConversations'
import AgentNotifications from '../pages/agent/AgentNotifications'

// Manager pages
import ManagerDashboard from '../pages/manager/ManagerDashboard'

// Error pages
import UnauthorizedPage from '../pages/UnauthorizedPage'
import NotFoundPage from '../pages/NotFoundPage'

function AppRouter() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/properties" element={<PropertyListPage />} />
      <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />

      {/* Protected client routes */}
      <Route
        path="/client/*"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['client']}>
              <ClientRoutes />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected agent routes */}
      <Route
        path="/agent/*"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['agent']}>
              <AgentRoutes />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected manager routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <ManagerRoutes />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Default redirect based on role */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === 'client' ? (
              <Navigate to="/client/dashboard" replace />
            ) : user?.role === 'agent' ? (
              <Navigate to="/agent/dashboard" replace />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function ClientRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ClientDashboard />} />
      <Route path="/search-requests" element={<div>Search Requests (Coming Soon)</div>} />
      <Route path="/matches" element={<div>Matches (Coming Soon)</div>} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/saved-searches" element={<div>Saved Searches (Coming Soon)</div>} />
      <Route path="/conversations" element={<div>Conversations (Coming Soon)</div>} />
      <Route path="/conversations/:conversationId" element={<ConversationDetailPage />} />
      <Route path="/appointments" element={<div>Appointments (Coming Soon)</div>} />
      <Route path="/notifications" element={<div>Notifications (Coming Soon)</div>} />
      <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
    </Routes>
  )
}

function AgentRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<AgentDashboard />} />
      <Route path="/profile" element={<AgentProfile />} />
      <Route path="/properties" element={<AgentProperties />} />
      <Route path="/properties/new" element={<PropertyCreate />} />
      <Route path="/properties/:propertyId/edit" element={<PropertyEdit />} />
      <Route path="/appointments" element={<AgentAppointments />} />
      <Route path="/conversations" element={<AgentConversations />} />
      <Route path="/conversations/:conversationId" element={<div>Conversation Detail (Coming Soon)</div>} />
      <Route path="/notifications" element={<AgentNotifications />} />
      <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
    </Routes>
  )
}

function ManagerRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ManagerDashboard />} />
      <Route path="/analytics" element={<div>Analytics (Coming Soon)</div>} />
      <Route path="/users" element={<div>Users (Coming Soon)</div>} />
      <Route path="/agents" element={<div>Agents (Coming Soon)</div>} />
      <Route path="/properties" element={<div>Properties (Coming Soon)</div>} />
      <Route path="/appointments" element={<div>Appointments (Coming Soon)</div>} />
      <Route path="/conversations" element={<div>Conversations (Coming Soon)</div>} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
