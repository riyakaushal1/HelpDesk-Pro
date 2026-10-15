
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconClock, IconShield, IconSpark } from '../components/Icons'
import { apiRequest } from '../services/api'
import './Auth.css'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function clearMessages() {
    setError('')
    setMessage('')
  }

  async function handleSendOtp(event) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    clearMessages()
    setLoading(true)

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      })

      setEmail(normalizedEmail)
      setStep(2)
      setMessage(
        'If an account exists for this email, a six-digit reset code will be sent.',
      )
    } catch (err) {
      setError(err.message || 'Could not send the reset code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the six-digit code.')
      return
    }

    clearMessages()
    setLoading(true)

    try {
      await apiRequest('/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
        }),
      })

      setStep(3)
      setMessage('Code verified. You can now set a new password.')
    } catch (err) {
      setError(err.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    clearMessages()
    setLoading(true)

    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          password,
          confirmPassword,
        }),
      })

      navigate('/login', {
        state: {
          passwordResetMessage:
            result.message ||
            'Password reset successful. Please log in with your new password.',
        },
      })
    } catch (err) {
      setError(err.message || 'Could not reset your password.')
    } finally {
      setLoading(false)
    }
  }

  function handleResendOtp() {
    setOtp('')
    setStep(1)
    clearMessages()
    setMessage('Enter your email again to request a new code.')
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
            Account recovery, kept simple and secure.
          </h2>

          <p className="auth-aside-text">
            Reset your password in three short steps and get straight back to
            your support queue.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconSpark size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Three quick steps</strong>
                <span>Confirm your email, verify the code, set a new password.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconClock size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Time-limited codes</strong>
                <span>Reset codes expire in 10 minutes.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconShield size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Private by default</strong>
                <span>We never reveal whether an email is registered.</span>
              </div>
            </li>
          </ul>

          <p className="auth-aside-foot">
            Your data stays protected throughout recovery.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link className="brand" to="/login">
            <span className="brand-mark">h.</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </Link>

          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <span className="auth-step">STEP {step} OF 3</span>

          <h1>
            {step === 1 && 'Forgot password?'}
            {step === 2 && 'Verify your email'}
            {step === 3 && 'Create new password'}
          </h1>

          <p className="muted">
            {step === 1 &&
              'Enter your registered email address to receive a six-digit reset code.'}
            {step === 2 &&
              `Enter the six-digit code sent to ${email}. The code expires in 10 minutes.`}
            {step === 3 &&
              'Choose a new password for your HelpDesk Pro account.'}
          </p>

          {error && (
            <p className="notice-banner banner-gap" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="notice-banner banner-gap" role="status">
              {message}
            </p>
          )}

          {step === 1 && (
            <form className="form-grid" onSubmit={handleSendOtp} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="recovery-email">
                  Email address
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  disabled={loading}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearMessages()
                  }}
                />
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Sending code...' : 'Send reset code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="form-grid" onSubmit={handleVerifyOtp} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="recovery-otp">
                  Six-digit verification code
                </label>
                <input
                  id="recovery-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  disabled={loading}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    clearMessages()
                  }}
                />
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify code'}
              </button>

              <button
                className="secondary-btn"
                type="button"
                disabled={loading}
                onClick={handleResendOtp}
              >
                Request a new code
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              className="form-grid"
              onSubmit={handleResetPassword}
              noValidate
            >
              <div className="field">
                <label className="field-label" htmlFor="new-password">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={password}
                  disabled={loading}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    clearMessages()
                  }}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter password again"
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    clearMessages()
                  }}
                />
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="auth-links">
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
