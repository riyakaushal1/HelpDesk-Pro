
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconBook, IconShield, IconSpark } from '../components/Icons'
import { useTickets } from '../context/TicketContext'
import { CATEGORIES, PRIORITIES, validateTicketForm } from '../utils/tickets'
import './CreateTicket.css'

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'Medium',
  category: '',
}

export default function CreateTicket() {
  const navigate = useNavigate()
  const { addTicket } = useTickets()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const submittingRef = useRef(false)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setApiError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return

    const nextErrors = validateTicketForm(form)
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) return

    submittingRef.current = true
    setSubmitting(true)

    try {
      const ticket = await addTicket(form)
      setCreated(ticket)
      setForm(EMPTY_FORM)
    } catch (err) {
      setApiError(err.message || 'Could not create ticket.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="create-ticket">
      <header className="page-header">
        <div>
          <p className="eyebrow">NEW REQUEST</p>
          <h1>Create ticket</h1>
          <p className="page-subtitle">
            Describe the issue clearly. Your ticket will be saved to your HelpDesk Pro account.
          </p>
        </div>
      </header>

      {apiError && (
        <p className="field-error" role="alert">{apiError}</p>
      )}

      {created && (
        <p className="success-banner" role="status">
          Ticket created successfully. ID: {created.id}{' '}
          <Link to={`/tickets/${created.id}`}>Open ticket</Link>
        </p>
      )}

      <div className="create-ticket-main">
        <section className="panel">
          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <div className="field-meta">
                <label className="field-label" htmlFor="title">Ticket title</label>
                <span>{form.title.trim().length}/100</span>
              </div>
              <input
                id="title"
                name="title"
                value={form.title}
                maxLength={100}
                placeholder="Short summary of the issue"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                onChange={(event) => updateField('title', event.target.value)}
              />
              {errors.title && (
                <p className="field-error" id="title-error">{errors.title}</p>
              )}
            </div>

            <div className="field">
              <div className="field-meta">
                <label className="field-label" htmlFor="description">Description</label>
                <span>{form.description.trim().length}/1000</span>
              </div>
              <textarea
                id="description"
                name="description"
                value={form.description}
                maxLength={1000}
                placeholder="What happened, what you expected, and useful details"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : undefined}
                onChange={(event) => updateField('description', event.target.value)}
              />
              {errors.description && (
                <p className="field-error" id="description-error">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(event) => updateField('priority', event.target.value)}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                {errors.priority && <p className="field-error">{errors.priority}</p>}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="category">
                  Category (optional)
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="field-error">{errors.category}</p>}
              </div>
            </div>

            <p className="muted">
              Your ticket is stored in the HelpDesk Pro database when creation succeeds.
            </p>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create ticket'}
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => navigate('/tickets')}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>

      <aside className="create-ticket-aside">
        <section className="panel">
          <p className="eyebrow">GUIDANCE</p>
          <h2 className="section-title">Writing a good ticket</h2>
          <ul className="create-tip-list">
            <li className="create-tip">
              <span className="create-tip-icon" aria-hidden="true">
                <IconSpark size={16} />
              </span>
              <div>
                <strong>Be specific</strong>
                <p className="muted">
                  Include what happened, what you expected, and the steps to reproduce it.
                </p>
              </div>
            </li>
            <li className="create-tip">
              <span className="create-tip-icon" aria-hidden="true">
                <IconBook size={16} />
              </span>
              <div>
                <strong>Add context</strong>
                <p className="muted">
                  Mention error messages, the page you were on, and any recent changes.
                </p>
              </div>
            </li>
            <li className="create-tip">
              <span className="create-tip-icon" aria-hidden="true">
                <IconShield size={16} />
              </span>
              <div>
                <strong>One issue per ticket</strong>
                <p className="muted">
                  Keep unrelated problems separate so each one can be tracked clearly.
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">PRIORITY</p>
          <h2 className="section-title">How priority works</h2>
          <ul className="create-priority-list">
            <li className="create-priority-row">
              <span className="badge badge-low">Low</span>
              <p className="muted">A minor issue or question with no urgent impact.</p>
            </li>
            <li className="create-priority-row">
              <span className="badge badge-medium">Medium</span>
              <p className="muted">Something is broken, but you can keep working around it.</p>
            </li>
            <li className="create-priority-row">
              <span className="badge badge-high">High</span>
              <p className="muted">Blocking your work or affecting many people. Needs attention soon.</p>
            </li>
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">SUPPORT</p>
          <h2 className="section-title">Need help?</h2>
          <p className="muted">
            Browse guides and answers written by the support team.
          </p>
          <p className="page-action">
            <Link className="text-btn" to="/knowledge">
              Open the knowledge base
            </Link>
          </p>
        </section>
      </aside>
    </div>
  )
}
