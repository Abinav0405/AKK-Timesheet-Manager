import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './globals.css'

import Home from './Pages/Home.jsx'
import WorkerTypeSelection from './Pages/WorkerTypeSelection.jsx'
import WorkerLogin from './Pages/WorkerLogin.jsx'
import WorkerPortal from './Pages/WorkerPortal.jsx'
import AdminLogin from './Pages/AdminLogin.jsx'
import AdminDashboard from './Pages/AdminDashboard.jsx'
import History from './Pages/History.jsx'
import LeaveHistory from './Pages/LeaveHistory.jsx'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/WorkerLogin" element={<Navigate to="/worker" replace />} />
          <Route path="/worker" element={<WorkerTypeSelection />} />
          <Route path="/worker/login" element={<WorkerLogin />} />
          <Route path="/WorkerPortal" element={<WorkerPortal />} />
          <Route path="/AdminLogin" element={<AdminLogin />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/History" element={<History />} />
          <Route path="/LeaveHistory" element={<LeaveHistory />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </QueryClientProvider>
  </React.StrictMode>,
)
