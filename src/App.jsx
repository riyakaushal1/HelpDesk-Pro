
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TicketProvider } from './context/TicketContext'
import AppLayout from './layouts/AppLayout'
import ArticleDetail from './pages/ArticleDetail'
import CreateTicket from './pages/CreateTicket'
import ForgotPassword from './pages/ForgotPassword'
import KnowledgeBase from './pages/KnowledgeBase'
import Login from './pages/Login'
import MyTickets from './pages/MyTickets'
import NotFound from './pages/NotFound'
import Overview from './pages/Overview'
import Signup from './pages/Signup'
import TicketDetail from './pages/TicketDetail'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import VerifyEmail from './pages/VerifyEmail'
import { apiRequest } from './services/api'
import './App.css'

function AdminRoute({ children }) {
  const [access, setAccess] = useState(() =>
    localStorage.getItem('helpdesk_token') ? 'checking' : 'denied',
  )
  const [accessError, setAccessError] = useState('')

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('helpdesk_token')

    if (!token) {
      return () => { active = false }
    }

    apiRequest('/auth/me')
      .then((data) => {
        if (!active) return

        if (data.user?.role !== 'admin') {
          setAccess('denied')
          return
        }

        localStorage.setItem('helpdesk_user', JSON.stringify(data.user))
        setAccess('granted')
      })
      .catch((error) => {
        if (active) {
          setAccessError(error.message || 'Could not verify your account.')
          setAccess('error')
        }
      })

    return () => { active = false }
  }, [])

  if (access === 'checking') {
    return <main className="page"><p role="status">Verifying admin access…</p></main>
  }

  if (access === 'error') {
    return (
      <main className="page">
        <section className="panel">
          <h1>Could not verify admin access</h1>
          <p className="muted">{accessError}</p>
          <p><a className="secondary-btn" href="/admin/login">Return to admin login</a></p>
        </section>
      </main>
    )
  }

  if (access !== 'granted') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default function App() {
  return (
    <TicketProvider>
      <BrowserRouter>
        <Routes>
          {/* Existing user application */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/create" element={<CreateTicket />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/knowledge/:slug" element={<ArticleDetail />} />
            <Route
              path="/overview"
              element={<Navigate to="/" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Existing authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin application */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tickets/:id"
            element={
              <AdminRoute>
                <TicketDetail />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TicketProvider>
  )
}
