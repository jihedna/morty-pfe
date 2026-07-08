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
import ClientSearchRequests from '../pages/client/ClientSearchRequests'
import ClientMatches from '../pages/client/ClientMatches'
import FavoritesPage from '../pages/client/FavoritesPage'
import SavedSearchesPage from '../pages/client/SavedSearchesPage'
import ClientConversations from '../pages/client/ClientConversations'
import ConversationDetailPage from '../pages/client/ConversationDetailPage'
import ClientAppointments from '../pages/client/ClientAppointments'
import ClientNotifications from '../pages/client/ClientNotifications'

// Agent pages
import AgentDashboard from '../pages/agent/AgentDashboard'
import AgentProfile from '../pages/agent/AgentProfile'
import AgentProperties from '../pages/agent/AgentProperties'
import PropertyCreate from '../pages/agent/PropertyCreate'
import PropertyEdit from '../pages/agent/PropertyEdit'
import AgentAppointments from '../pages/agent/AgentAppointments'
import AgentConversations from '../pages/agent/AgentConversations'
import AgentConversationDetail from '../pages/agent/AgentConversationDetail'
import AgentNotifications from '../pages/agent/AgentNotifications'

// Manager pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminAgents from '../pages/admin/AdminAgents'
import AdminProperties from '../pages/admin/AdminProperties'
import AdminAppointments from '../pages/admin/AdminAppointments'
import AdminConversations from '../pages/admin/AdminConversations'
import AdminConversationDetail from '../pages/admin/AdminConversationDetail'

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
      <Route path="/search-requests" element={<ClientSearchRequests />} />
      <Route path="/matches" element={<ClientMatches />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/saved-searches" element={<SavedSearchesPage />} />
      <Route path="/conversations" element={<ClientConversations />} />
      <Route path="/conversations/:conversationId" element={<ConversationDetailPage />} />
      <Route path="/appointments" element={<ClientAppointments />} />
      <Route path="/notifications" element={<ClientNotifications />} />
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
      <Route path="/properties/:propertyId" element={<PropertyEdit />} />
      <Route path="/properties/:propertyId/edit" element={<PropertyEdit />} />
      <Route path="/appointments" element={<AgentAppointments />} />
      <Route path="/conversations" element={<AgentConversations />} />
      <Route path="/conversations/:conversationId" element={<AgentConversationDetail />} />
      <Route path="/notifications" element={<AgentNotifications />} />
      <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
    </Routes>
  )
}

function ManagerRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/analytics" element={<AdminAnalytics />} />
      <Route path="/users" element={<AdminUsers />} />
      <Route path="/agents" element={<AdminAgents />} />
      <Route path="/properties" element={<AdminProperties />} />
      <Route path="/appointments" element={<AdminAppointments />} />
      <Route path="/conversations" element={<AdminConversations />} />
      <Route path="/conversations/:conversationId" element={<AdminConversationDetail />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
