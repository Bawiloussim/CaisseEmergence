import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './components/Auth/AuthContext'
import RequireAuth from './components/Auth/RequireAuth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RequireAuth>
        <App />
      </RequireAuth>
    </AuthProvider>
  </StrictMode>,
)
