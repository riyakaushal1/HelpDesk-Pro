
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconClock, IconShield, IconTickets } from '../components/Icons'
import { apiRequest } from '../services/api'
import './Auth.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      if (data.user?.role !== 'admin') {
        setError('Access denied. Admin account required.')
        return
      }

      localStorage.setItem('helpdesk_token', data.token)
      localStorage.setItem('helpdesk_user', JSON.stringify(data.user))

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <div className="auth-aside-brand">
            <span className="auth-aside-mark">H</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </div>

          <h2 className="auth-aside-title">
            Administration and access control.
          </h2>

          <p className="auth-aside-text">
            The admin portal is restricted to authorised administrators. Manage
            teams, roles and every support ticket from one place.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconShield size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Restricted access</strong>
                <span>Only admin accounts can enter the portal.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconTickets size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Full oversight</strong>
                <span>Review and manage every ticket in the workspace.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconClock size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Audit-ready</strong>
                <span>Track who did what, and when.</span>
              </div>
            </li>
          </ul>

          <p className="auth-aside-foot">
            Authorised personnel only. Activity may be logged.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <span className="brand">
            <span className="brand-mark">H</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </span>

          <p className="eyebrow">HELPDESK PRO</p>
          <h1>Admin Portal</h1>
          <p className="muted">
            Sign in to manage support tickets.
          </p>

          {error && (
            <p className="error-banner banner-gap" role="alert">
              {error}
            </p>
          )}
          {error.includes('Email verification required') && (
            <p className="page-action">
              <Link
                className="text-btn"
                to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
              >
                Verify your email
              </Link>
            </p>
          )}

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="admin-email">
                Admin email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in as Admin →'}
            </button>
          </form>

          <p className="auth-back">
            Are you a user? <Link to="/login">User login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
