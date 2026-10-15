
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconClock,
  IconEye,
  IconEyeOff,
  IconShield,
  IconSpark,
} from '../components/Icons'
import { useTickets } from '../context/TicketContext'
import { apiRequest } from '../services/api'
import './Auth.css'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Login() {
  const navigate = useNavigate()
  const { refreshTickets } = useTickets()

  const [role, setRole] = useState('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Enter your email.'
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) return

    setLoading(true)
    setMessage('')
    setVerificationRequired(false)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      if (!data.token || !data.user) {
        throw new Error('Login failed: account details were not received.')
      }

      // Verify the selected login type against the database role.
      if (data.user.role !== role) {
        const accountRole = data.user.role === 'admin'
          ? 'administrator'
          : data.user.role === 'support'
            ? 'support agent'
            : 'user'
        throw new Error(`This account is a ${accountRole}. Choose the matching login type.`)
      }

      localStorage.setItem('helpdesk_token', data.token)
      localStorage.setItem('helpdesk_user', JSON.stringify(data.user))

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        await refreshTickets()
        navigate(role === 'support' ? '/tickets' : '/', { replace: true })
      }
    } catch (error) {
      setMessage(error.message || 'Login failed. Please try again.')
      setVerificationRequired(error.message?.includes('Email verification required'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <div className="auth-aside-brand">
            <span className="auth-aside-mark">h.</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </div>

          <h2 className="auth-aside-title">
            Support that keeps every conversation on track.
          </h2>

          <p className="auth-aside-text">
            Sign in to a calm, organised desk where tickets, customers and
            resolutions live in one place.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconSpark size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Smart triage</strong>
                <span>Prioritise and route tickets in seconds.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconClock size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Faster replies</strong>
                <span>Context and saved replies at your fingertips.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconShield size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Secure access</strong>
                <span>Role-based sign-in for users, agents and admins.</span>
              </div>
            </li>
          </ul>

          <p className="auth-aside-foot">
            Trusted by support teams to resolve more, faster.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link className="brand" to="/">
            <span className="brand-mark">h.</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </Link>

          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in</h1>

          <p className="muted">
            Choose your account type to continue.
          </p>

          <div
            className="auth-role-switch"
            role="group"
            aria-label="Choose account type"
          >
            <button
              type="button"
              className={role === 'user' ? 'auth-role active' : 'auth-role'}
              aria-pressed={role === 'user'}
              onClick={() => {
                setRole('user')
                setMessage('')
              }}
            >
              👤 User Login
            </button>

            <button
              type="button"
              className={role === 'support' ? 'auth-role active' : 'auth-role'}
              aria-pressed={role === 'support'}
              onClick={() => {
                setRole('support')
                setMessage('')
              }}
            >
              🎧 Support Login
            </button>

            <button
              type="button"
              className={role === 'admin' ? 'auth-role active' : 'auth-role'}
              aria-pressed={role === 'admin'}
              onClick={() => {
                setRole('admin')
                setMessage('')
              }}
            >
              🛡️ Admin Login
            </button>
          </div>

          <p className="muted auth-role-hint">
            {role === 'admin'
              ? 'Sign in with your authorized administrator account.'
              : role === 'support'
                ? 'Sign in to review and respond to support tickets.'
                : 'Sign in to create and track your support tickets.'}
          </p>

          {message && (
            <p className="notice-banner banner-gap" role="alert">
              {message}
            </p>
          )}
          {verificationRequired && (
            <p className="page-action">
              <Link
                className="text-btn"
                to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
              >
                Verify your email or resend the code
              </Link>
            </p>
          )}

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrors((current) => ({ ...current, email: '' }))
                  setMessage('')
                }}
              />

              {errors.email && (
                <p className="field-error">{errors.email}</p>
              )}
            </div>

            <div className="field">
              <div className="auth-card-head">
                <label className="field-label" htmlFor="password">
                  Password
                </label>

                <Link className="text-btn" to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  placeholder="Enter password"
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: '' }))
                    setMessage('')
                  }}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <IconEyeOff size={16} />
                    : <IconEye size={16} />}
                </button>
              </div>

              {errors.password && (
                <p className="field-error">{errors.password}</p>
              )}
            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : `Continue as ${role === 'admin'
                  ? 'Admin'
                  : role === 'support'
                    ? 'Support'
                    : 'User'}`}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/signup">Create an account</Link>
            <Link to="/">Back to app</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
