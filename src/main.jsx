import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { PosProvider } from './context/PosContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PosProvider>
        <App />
      </PosProvider>
    </BrowserRouter>
  </StrictMode>,
)
