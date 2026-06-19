# Frontend Architecture

## Overview

The RE/MAX Smile AI frontend is built with React.js and Tailwind CSS, following a component-based architecture with modern best practices. The application uses React Router for navigation, Context API and custom hooks for state management, and Axios for API communication.

## Technology Stack

- **Framework**: React 18+ with functional components and hooks
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router v6 for client-side routing
- **State Management**: React Context API + custom hooks
- **HTTP Client**: Axios for API requests
- **Form Handling**: React Hook Form for form validation
- **Maps**: Google Maps JavaScript API or React Google Maps
- **Icons**: Lucide React or Heroicons
- **Build Tool**: Vite for fast development and optimized builds
- **Type Checking**: TypeScript for type safety (optional)
- **Testing**: React Testing Library and Vitest

## Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navigation.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ForgotPasswordForm.jsx
│   │   │   └── ResetPasswordForm.jsx
│   │   ├── property/
│   │   │   ├── PropertyCard.jsx
│   │   │   ├── PropertyList.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── PropertySearch.jsx
│   │   │   ├── PropertyFilters.jsx
│   │   │   ├── PropertyMap.jsx
│   │   │   └── PropertyImageGallery.jsx
│   │   ├── agent/
│   │   │   ├── AgentCard.jsx
│   │   │   ├── AgentProfile.jsx
│   │   │   ├── AgentRecommendations.jsx
│   │   │   └── AgentList.jsx
│   │   ├── chatbot/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── SourceCitation.jsx
│   │   ├── client/
│   │   │   ├── RequirementForm.jsx
│   │   │   ├── FavoritesList.jsx
│   │   │   └── ClientDashboard.jsx
│   │   ├── agent/
│   │   │   ├── AgentDashboard.jsx
│   │   │   ├── LeadList.jsx
│   │   │   ├── LeadDetail.jsx
│   │   │   ├── LeadNotes.jsx
│   │   │   └── AgentProfileEdit.jsx
│   │   └── manager/
│   │       ├── ManagerDashboard.jsx
│   │       ├── AnalyticsOverview.jsx
│   │       ├── UserManagement.jsx
│   │       ├── DocumentManagement.jsx
│   │       └── AgentPerformance.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── PropertySearch.jsx
│   │   ├── PropertyDetail.jsx
│   │   ├── AgentRecommendations.jsx
│   │   ├── AgentProfile.jsx
│   │   ├── Chatbot.jsx
│   │   ├── ClientDashboard.jsx
│   │   ├── AgentDashboard.jsx
│   │   ├── ManagerDashboard.jsx
│   │   ├── Profile.jsx
│   │   └── NotFound.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useProperties.js
│   │   ├── useAgents.js
│   │   ├── useChatbot.js
│   │   ├── useLeads.js
│   │   └── useFavorites.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── propertyService.js
│   │   ├── agentService.js
│   │   ├── chatbotService.js
│   │   ├── leadService.js
│   │   └── documentService.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json (if using TypeScript)
└── .env.example
```

## Core Components

### Authentication Components

**LoginForm.jsx**
- Email and password input fields
- Form validation
- Error handling and display
- Remember me checkbox
- Link to registration and forgot password

**RegisterForm.jsx**
- Multi-step registration form
- Role selection (client/agent)
- Agent-specific fields (license number, agency, experience)
- Email verification status
- Form validation

**ForgotPasswordForm.jsx**
- Email input for password reset
- Success message display

**ResetPasswordForm.jsx**
- New password input with confirmation
- Password strength indicator
- Token validation

### Property Components

**PropertyCard.jsx**
- Property image display
- Key property information (price, size, location)
- Favorite button
- View details link
- Agent information

**PropertyList.jsx**
- Grid or list view toggle
- Sorting options
- Pagination controls
- Empty state handling

**PropertySearch.jsx**
- Search input field
- Advanced filter panel
- Filter application
- Results display

**PropertyFilters.jsx**
- Location filter (dropdown or checkbox)
- Price range slider
- Property type checkboxes
- Size range inputs
- Room count filter
- Amenities checkboxes
- Condition filter
- Reset filters button

**PropertyMap.jsx**
- Google Maps integration
- Property markers
- Cluster markers for dense areas
- Marker click to show property preview
- Filter properties on map

**PropertyDetail.jsx**
- Image gallery with thumbnails
- Full property information
- Agent contact section
- Favorite functionality
- Map location display
- Similar properties

### Agent Components

**AgentCard.jsx**
- Agent photo and name
- Specialization areas
- Rating display
- Availability status
- View profile link

**AgentProfile.jsx**
- Detailed agent information
- Performance metrics
- Client reviews
- Contact form
- Availability calendar

**AgentRecommendations.jsx**
- List of recommended agents
- Compatibility score display
- Recommendation explanation
- Sort by compatibility
- Contact agent buttons

### Chatbot Components

**ChatInterface.jsx**
- Chat message display area
- Auto-scroll to latest message
- Session management
- Clear chat history

**ChatMessage.jsx**
- User and assistant message styling
- Source citation display
- Timestamp display
- Message status indicators

**ChatInput.jsx**
- Text input field
- Send button
- Character limit
- Loading state during response

**SourceCitation.jsx**
- Document title
- Relevance score
- Link to document (if available)

### Dashboard Components

**ClientDashboard.jsx**
- Overview of client activity
- Recent requirements
- Favorite properties
- Recommended agents
- Quick actions

**AgentDashboard.jsx**
- Assigned leads summary
- Lead conversion metrics
- Response time statistics
- Quick lead actions
- Performance overview

**ManagerDashboard.jsx**
- Agency overview metrics
- User statistics
- Lead conversion rates
- Property listing statistics
- Quick admin actions

**AnalyticsOverview.jsx**
- Chart displays (using Chart.js or Recharts)
- Date range selector
- Metric cards
- Export functionality

**UserManagement.jsx**
- User list with filters
- User status management
- Role assignment
- User details modal

**DocumentManagement.jsx**
- Document upload
- Document list with filters
- Document editing
- Document status management

## State Management

### AuthContext

Manages authentication state across the application:

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => { /* ... */ };
  const logout = () => { /* ... */ };
  const register = async (userData) => { /* ... */ };
  const refreshToken = async () => { /* ... */ };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, register, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### ThemeContext

Manages theme preferences (light/dark mode):

```javascript
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### NotificationContext

Manages toast notifications and alerts:

```javascript
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => { /* ... */ };
  const removeNotification = (id) => { /* ... */ };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
```

## Custom Hooks

### useAuth

Authentication operations:

```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### useApi

API communication with automatic token handling:

```javascript
export const useApi = () => {
  const { token, refreshToken, logout } = useAuth();

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/v1',
  });

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          await refreshToken();
          return api.request(error.config);
        } catch (refreshError) {
          logout();
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};
```

### useProperties

Property-related operations:

```javascript
export const useProperties = () => {
  const api = useApi();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProperties = async (filters) => { /* ... */ };
  const getProperty = async (id) => { /* ... */ };
  const addFavorite = async (propertyId) => { /* ... */ };
  const removeFavorite = async (propertyId) => { /* ... */ };

  return { properties, loading, error, searchProperties, getProperty, addFavorite, removeFavorite };
};
```

### useAgents

Agent-related operations:

```javascript
export const useAgents = () => {
  const api = useApi();
  const [agents, setAgents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const getRecommendations = async (requirementId) => { /* ... */ };
  const getAgentProfile = async (agentId) => { /* ... */ };
  const contactAgent = async (agentId, message) => { /* ... */ };

  return { agents, recommendations, getRecommendations, getAgentProfile, contactAgent };
};
```

### useChatbot

Chatbot operations:

```javascript
export const useChatbot = () => {
  const api = useApi();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const createSession = async () => { /* ... */ };
  const sendMessage = async (content) => { /* ... */ };
  const clearHistory = async () => { /* ... */ };

  return { session, messages, loading, createSession, sendMessage, clearHistory };
};
```

### useLeads

Lead management for agents:

```javascript
export const useLeads = () => {
  const api = useApi();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const getLeads = async (filters) => { /* ... */ };
  const getLead = async (leadId) => { /* ... */ };
  const updateLeadStatus = async (leadId, status) => { /* ... */ };
  const addNote = async (leadId, note) => { /* ... */ };

  return { leads, loading, getLeads, getLead, updateLeadStatus, addNote };
};
```

## Routing

### Route Configuration

```javascript
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes - Client */}
          <Route path="/properties" element={<ProtectedRoute allowedRoles={['client', 'agent', 'manager']}><PropertySearch /></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute allowedRoles={['client', 'agent', 'manager']}><PropertyDetail /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute allowedRoles={['client']}><AgentRecommendations /></ProtectedRoute>} />
          <Route path="/agents/:id" element={<ProtectedRoute allowedRoles={['client', 'manager']}><AgentProfile /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute allowedRoles={['client', 'agent', 'manager']}><Chatbot /></ProtectedRoute>} />
          <Route path="/client/dashboard" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Protected Routes - Agent */}
          <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
          <Route path="/agent/leads/:id" element={<ProtectedRoute allowedRoles={['agent']}><LeadDetail /></ProtectedRoute>} />

          {/* Protected Routes - Manager */}
          <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/users" element={<ProtectedRoute allowedRoles={['manager']}><UserManagement /></ProtectedRoute>} />
          <Route path="/manager/documents" element={<ProtectedRoute allowedRoles={['manager']}><DocumentManagement /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## API Services

### api.js

Base API configuration:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### authService.js

Authentication API calls:

```javascript
import api from './api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (currentPassword, newPassword) => api.put('/users/me/password', { current_password: currentPassword, new_password: newPassword }),
};
```

### propertyService.js

Property API calls:

```javascript
import api from './api';

export const propertyService = {
  searchProperties: (filters) => api.get('/properties', { params: filters }),
  getProperty: (id) => api.get(`/properties/${id}`),
  addProperty: (data) => api.post('/properties', data),
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  addFavorite: (propertyId) => api.post('/favorites', { property_id: propertyId }),
  getFavorites: () => api.get('/favorites'),
  removeFavorite: (propertyId) => api.delete(`/favorites/${propertyId}`),
};
```

## Form Validation

### React Hook Form Integration

```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
};
```

## Responsive Design

### Tailwind CSS Breakpoints

- **Mobile**: < 640px (default styles)
- **Tablet**: 640px - 1024px (sm, md)
- **Desktop**: > 1024px (lg, xl, 2xl)

### Mobile-First Approach

All components should be designed mobile-first with responsive enhancements:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## Performance Optimization

### Code Splitting

```javascript
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/properties/:id" element={<PropertyDetail />} />
    <Route path="/agent/dashboard" element={<AgentDashboard />} />
  </Routes>
</Suspense>
```

### Image Optimization

- Use WebP format when possible
- Implement lazy loading for images
- Use responsive images with srcset
- Compress images before deployment

### Memoization

```javascript
import { memo, useMemo, useCallback } from 'react';

const PropertyCard = memo(({ property }) => {
  const formattedPrice = useMemo(() => formatPrice(property.price), [property.price]);
  
  const handleFavorite = useCallback(() => {
    // Handle favorite action
  }, [property.id]);

  return (
    <Card>
      {/* Card content */}
    </Card>
  );
});
```

## Accessibility

### WCAG 2.1 Compliance

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Color contrast ratios
- Screen reader compatibility

### Example Accessible Component

```jsx
<button
  aria-label="Add to favorites"
  onClick={handleFavorite}
  className="p-2 rounded hover:bg-gray-100"
>
  <HeartIcon aria-hidden="true" />
</button>
```

## Error Handling

### Error Boundary

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Global Error Handler

```javascript
// In main.jsx
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

## Testing Strategy

### Unit Testing

```javascript
// PropertyCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyCard from './PropertyCard';

describe('PropertyCard', () => {
  it('renders property information', () => {
    const property = {
      id: '1',
      title: 'Test Property',
      price: 250000,
      city: 'Tunis',
    };
    render(<PropertyCard property={property} />);
    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });

  it('calls onFavorite when favorite button is clicked', () => {
    const onFavorite = jest.fn();
    const property = { id: '1', title: 'Test Property', price: 250000 };
    render(<PropertyCard property={property} onFavorite={onFavorite} />);
    fireEvent.click(screen.getByLabelText('Add to favorites'));
    expect(onFavorite).toHaveBeenCalledWith('1');
  });
});
```

### Integration Testing

```javascript
// PropertySearch.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertySearch from './PropertySearch';

describe('PropertySearch Integration', () => {
  it('loads and displays properties', async () => {
    render(
      <BrowserRouter>
        <PropertySearch />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Properties Found')).toBeInTheDocument();
    });
  });
});
```

## Deployment

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```env
VITE_API_URL=http://localhost:8000/v1
VITE_GOOGLE_MAPS_API_KEY=your_api_key
VITE_APP_NAME=RE/MAX Smile AI
```

### Production Considerations

- Enable gzip compression
- Implement CDN for static assets
- Configure proper caching headers
- Use HTTPS
- Enable CSP headers
- Implement rate limiting on API calls
