
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconEye,
  IconEyeOff,
  IconInbox,
  IconResolved,
  IconSpark,
} from '../components/Icons'
import { useTickets } from '../context/TicketContext'
import { apiRequest } from '../services/api'
import './Auth.css'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Signup() {
  const navigate = useNavigate()
  const { clearTickets } = useTickets()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))

    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Enter your full name.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Enter your email.'
    } else if (!isValidEmail(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Create a password.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.'
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })

      localStorage.removeItem('helpdesk_token')
      localStorage.removeItem('helpdesk_user')
      clearTickets()
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
    } catch (error) {
      setMessage(error.message || 'Signup failed. Please try again.')
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
            Create an account and get support moving.
          </h2>

          <p className="auth-aside-text">
            Bring your team and your customers into one shared workspace built
            for fast, friendly help.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconSpark size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Set up in minutes</strong>
                <span>Create your account and start raising tickets.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconInbox size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>One shared inbox</strong>
                <span>Every request tracked from open to close.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconResolved size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Resolve with context</strong>
                <span>Conversations, files and history in one thread.</span>
              </div>
            </li>
          </ul>

          <p className="auth-aside-foot">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link className="brand" to="/">
            <span className="brand-mark">h.</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </Link>

          <p className="eyebrow">CREATE YOUR ACCOUNT</p>

          <h1>Create account</h1>

          <p className="muted">
            Create your HelpDesk Pro account to get started.
          </p>

          {message ? (
            <p
              className="notice-banner banner-gap"
              role="alert"
            >
              {message}
            </p>
          ) : null}
          {message.includes('verification email') && (
            <p className="page-action">
              <Link
                className="text-btn"
                to={`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`}
              >
                Go to email verification or resend the code
              </Link>
            </p>
          )}

          <form
            className="form-grid"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="field">
              <label className="field-label" htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                value={form.name}
                autoComplete="name"
                placeholder="Jordan Lee"
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
              />

              {errors.name ? (
                <p className="field-error">{errors.name}</p>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                placeholder="you@company.com"
                onChange={(event) =>
                  updateField('email', event.target.value)
                }
              />

              {errors.email ? (
                <p className="field-error">{errors.email}</p>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">
                Password
              </label>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  placeholder="At least 8 characters"
                  onChange={(event) =>
                    updateField('password', event.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <IconEyeOff size={16} />
                  ) : (
                    <IconEye size={15} />
                  )}
                </button>
              </div>

              {errors.password ? (
                <p className="field-error">{errors.password}</p>
              ) : null}
            </div>

            <div className="field">
              <label
                className="field-label"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                placeholder="Repeat password"
                onChange={(event) =>
                  updateField('confirmPassword', event.target.value)
                }
              />

              {errors.confirmPassword ? (
                <p className="field-error">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/login">Already have an account</Link>
            <Link to="/">Back to app</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
