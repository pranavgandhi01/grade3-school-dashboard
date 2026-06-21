import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UpdatesProvider } from './context/UpdatesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UpdatesProvider>
      <App />
    </UpdatesProvider>
  </StrictMode>,
)
