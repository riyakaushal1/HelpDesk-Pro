import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IconClock, IconShield } from '../components/Icons'
import { apiRequest } from '../services/api'
import './Auth.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setVerifying(true)

    try {
      const data = await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code }),
      })
      setVerified(true)
      setMessage(data.message || 'Email verified. You can now sign in.')
    } catch (err) {
      setError(err.message || 'The verification code could not be checked.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    setError('')
    setMessage('')
    setResending(true)

    try {
      const data = await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setMessage(data.message || 'If verification is needed, a code will be sent shortly.')
    } catch (err) {
      setError(err.message || 'Could not resend the verification code.')
    } finally {
      setResending(false)
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
            One quick step to secure your account.
          </h2>

          <p className="auth-aside-text">
            We verify every new account so your tickets and conversations stay
            protected.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconShield size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Verified access</strong>
                <span>Only confirmed emails can sign in.</span>
              </div>
            </li>

            <li className="auth-feature">
              <span className="auth-feature-icon">
                <IconClock size={16} />
              </span>
              <div className="auth-feature-copy">
                <strong>Short-lived codes</strong>
                <span>Codes expire after 15 minutes for safety.</span>
              </div>
            </li>
          </ul>

          <p className="auth-aside-foot">
            Need a new code? You can resend it at any time.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link className="brand" to="/">
            <span className="brand-mark">h.</span>
            HelpDesk<span className="brand-accent"> Pro</span>
          </Link>
          <p className="eyebrow">EMAIL VERIFICATION</p>
          <h1>Verify your email</h1>
          <p className="muted">
            Enter the six-digit code sent to your email address. The code expires after 15 minutes.
          </p>

          {message && (
            <p className="success-banner banner-gap" role="status">{message}</p>
          )}
          {error && (
            <p className="notice-banner banner-gap" role="alert">{error}</p>
          )}

          {!verified && (
            <>
              <form className="form-grid" onSubmit={handleVerify}>
                <label className="field">
                  <span className="field-label">Email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Verification code</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </label>
                <button className="primary-btn" type="submit" disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify email'}
                </button>
              </form>
              <button
                className="text-btn page-action"
                type="button"
                disabled={resending || !email.trim()}
                onClick={handleResend}
              >
                {resending ? 'Sending…' : 'Resend verification code'}
              </button>
            </>
          )}

          {verified && (
            <p className="page-action">
              <Link className="primary-btn" to="/login">Continue to sign in</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
