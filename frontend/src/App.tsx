import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './router/AppRouter'
import ChatbotButton from './components/chatbot/ChatbotButton'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <ChatbotButton />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
