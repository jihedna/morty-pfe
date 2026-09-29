import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

// Public pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import PropertyListPage from '../pages/PropertyListPage'
import PropertyDetailPage from '../pages/PropertyDetailPage'
import MarketMapPage from '../pages/MarketMapPage'

// Client pages
import ClientDashboard from '../pages/client/ClientDashboard'
import ClientSearchRequests from '../pages/client/ClientSearchRequests'
import NewSearchRequest from '../pages/client/NewSearchRequest'
import SearchRequestMatches from '../pages/client/SearchRequestMatches'
import ClientMatches from '../pages/client/ClientMatches'
import FavoritesPage from '../pages/client/FavoritesPage'
import SavedSearchesPage from '../pages/client/SavedSearchesPage'
import SavedSearchResults from '../pages/client/SavedSearchResults'
import NewSavedSearch from '../pages/client/NewSavedSearch'
import ClientConversations from '../pages/client/ClientConversations'
import ConversationDetailPage from '../pages/client/ConversationDetailPage'
import ClientAppointments from '../pages/client/ClientAppointments'
import ClientNotifications from '../pages/client/ClientNotifications'
import InvestmentScorePage from '../pages/client/InvestmentScorePage'
import ClientRecommendations from '../pages/client/ClientRecommendations'
import PriceEstimationPage from '../pages/client/PriceEstimationPage'
import ClientDeals from '../pages/client/ClientDeals'
import ClientDealProperty from '../pages/client/ClientDealProperty'

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
import AgentLeads from '../pages/agent/AgentLeads'
import AgentLeadDetail from '../pages/agent/AgentLeadDetail'

// Manager pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminAgents from '../pages/admin/AdminAgents'
import AdminProperties from '../pages/admin/AdminProperties'
import AdminAppointments from '../pages/admin/AdminAppointments'
import AdminConversations from '../pages/admin/AdminConversations'
import AdminConversationDetail from '../pages/admin/AdminConversationDetail'
import AdminContracts from '../pages/admin/AdminContracts'
import AdminHeatMap from '../pages/admin/AdminHeatMap'
import AdminKnowledgeBase from '../pages/admin/AdminKnowledgeBase'
import ManagerMLModels from '../pages/manager/ManagerMLModels'

// Error pages
import UnauthorizedPage from '../pages/UnauthorizedPage'
import NotFoundPage from '../pages/NotFoundPage'

function AppRouter() {
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
      <Route path="/map" element={<Navigate to="/properties" replace />} />
      <Route path="/market-map" element={<ProtectedRoute><MarketMapPage /></ProtectedRoute>} />
      <Route path="/investment-score" element={<ProtectedRoute><InvestmentScorePage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><ClientRecommendations /></ProtectedRoute>} />
      <Route path="/price-estimation" element={<ProtectedRoute><PriceEstimationPage /></ProtectedRoute>} />

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

      {/* Landing page — public */}
      <Route path="/" element={<LandingPage />} />

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function ClientRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="search-requests" element={<ClientSearchRequests />} />
      <Route path="search-requests/new" element={<NewSearchRequest />} />
      <Route path="search-requests/:requestId/matches" element={<SearchRequestMatches />} />
      <Route path="matches" element={<ClientMatches />} />
      <Route path="favorites" element={<FavoritesPage />} />
      <Route path="saved-searches" element={<SavedSearchesPage />} />
      <Route path="saved-searches/new" element={<NewSavedSearch />} />
      <Route path="saved-searches/:savedSearchId/results" element={<SavedSearchResults />} />
      <Route path="conversations" element={<ClientConversations />} />
      <Route path="conversations/:conversationId" element={<ConversationDetailPage />} />
      <Route path="appointments" element={<ClientAppointments />} />
      <Route path="notifications" element={<ClientNotifications />} />
      <Route path="deals" element={<ClientDeals />} />
      <Route path="deals/:contractId/property" element={<ClientDealProperty />} />
      <Route path="investment-score" element={<InvestmentScorePage />} />
      <Route path="recommendations" element={<ClientRecommendations />} />
      <Route path="price-estimation" element={<PriceEstimationPage />} />
      <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
    </Routes>
  )
}

function AgentRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AgentDashboard />} />
      <Route path="profile" element={<AgentProfile />} />
      <Route path="properties" element={<AgentProperties />} />
      <Route path="properties/new" element={<PropertyCreate />} />
      <Route path="properties/:propertyId" element={<PropertyEdit />} />
      <Route path="properties/:propertyId/edit" element={<PropertyEdit />} />
      <Route path="appointments" element={<AgentAppointments />} />
      <Route path="conversations" element={<AgentConversations />} />
      <Route path="conversations/:conversationId" element={<AgentConversationDetail />} />
      <Route path="leads" element={<AgentLeads />} />
      <Route path="leads/:requestId" element={<AgentLeadDetail />} />
      <Route path="notifications" element={<AgentNotifications />} />
      <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
    </Routes>
  )
}

function ManagerRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="analytics" element={<AdminAnalytics />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="agents" element={<AdminAgents />} />
      <Route path="properties" element={<AdminProperties />} />
      <Route path="appointments" element={<AdminAppointments />} />
      <Route path="conversations" element={<AdminConversations />} />
      <Route path="conversations/:conversationId" element={<AdminConversationDetail />} />
      <Route path="contracts" element={<AdminContracts />} />
      <Route path="analytics/heat-map" element={<AdminHeatMap />} />
      <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
      <Route path="ml-models" element={<ManagerMLModels />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
