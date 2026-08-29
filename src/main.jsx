import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { initSessionInterceptors } from './utils/sessionHandler'

// Inicializar interceptores de expiración de sesión (JWT)
initSessionInterceptors();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
