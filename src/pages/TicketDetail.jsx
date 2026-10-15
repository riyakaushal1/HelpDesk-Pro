
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/Badge'
import { IconArrowLeft } from '../components/Icons'
import { useTickets } from '../context/TicketContext'
import { apiRequest } from '../services/api'
import { formatDate, STATUSES } from '../utils/tickets'
import './TicketDetail.css'

function formatMessageTimestamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function TicketDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { updateTicketStatus } = useTickets()
  const [ticketRecord, setTicketRecord] = useState({
    ticketId: null,
    ticket: null,
    loading: true,
    error: '',
  })

  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [conversation, setConversation] = useState({
    ticketId: null,
    messages: [],
    loading: true,
    error: '',
  })
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    apiRequest(`/tickets/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          const ticket = data.ticket
          setTicketRecord({
            ticketId: id,
            ticket: {
              ...ticket,
              id: String(ticket._id || ticket.id),
              createdAt: ticket.createdAt
                ? new Date(ticket.createdAt).toISOString()
                : new Date().toISOString(),
            },
            loading: false,
            error: '',
          })
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setTicketRecord({
            ticketId: id,
            ticket: null,
            loading: false,
            error: err.message || 'Could not load this ticket.',
          })
        }
      })

    return () => controller.abort()
  }, [id])

  useEffect(() => {
    const controller = new AbortController()

    apiRequest(`/tickets/${id}/messages`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setConversation({
            ticketId: id,
            messages: data.messages || [],
            loading: false,
            error: '',
          })
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setConversation({
            ticketId: id,
            messages: [],
            loading: false,
            error: err.message || 'Could not load the conversation.',
          })
        }
      })

    return () => controller.abort()
  }, [id])

  const ticketIsCurrent = ticketRecord.ticketId === id
  const ticket = ticketIsCurrent ? ticketRecord.ticket : null
  const ticketLoading = !ticketIsCurrent || ticketRecord.loading
  const ticketError = ticketIsCurrent ? ticketRecord.error : ''

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('helpdesk_user') || 'null')
    } catch {
      return null
    }
  })()
  const conversationIsCurrent = conversation.ticketId === id
  const messages = conversationIsCurrent ? conversation.messages : []
  const messagesLoading = !conversationIsCurrent || conversation.loading
  const conversationError = conversationIsCurrent ? conversation.error : ''

  const canUpdateStatus = ['admin', 'support'].includes(user?.role)
  const activity = [
    ...(ticket?.statusHistory || []).map((event) => ({
      ...event,
      kind: 'status',
    })),
    ...(ticket?.assignmentHistory || []).map((event) => ({
      ...event,
      kind: 'assignment',
    })),
  ].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))

  async function handleStatusChange(event) {
    const status = event.target.value
    setUpdating(true)
    setError('')

    try {
      const updatedTicket = await updateTicketStatus(ticket.id, status)
      setTicketRecord((current) => ({
        ...current,
        ticketId: id,
        ticket: updatedTicket,
      }))
    } catch (err) {
      setError(err.message || 'Could not update ticket status.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault()
    const message = newMessage.trim()
    if (!message) return

    setSending(true)
    setConversation((current) => ({
      ...current,
      ticketId: id,
      error: '',
    }))

    try {
      await apiRequest(`/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      setNewMessage('')

      try {
        const data = await apiRequest(`/tickets/${id}/messages`)
        setConversation({
          ticketId: id,
          messages: data.messages || [],
          loading: false,
          error: '',
        })
      } catch (err) {
        setConversation((current) => ({
          ...current,
          ticketId: id,
          loading: false,
          error: `Message sent, but the conversation could not be refreshed: ${err.message || 'Please try again.'}`,
        }))
      }
    } catch (err) {
      setConversation((current) => ({
        ...current,
        ticketId: id,
        error: err.message || 'Could not send your message.',
      }))
    } finally {
      setSending(false)
    }
  }

  if (ticketLoading) {
    return (
      <div className="ticket-detail ticket-detail-loading">
        <div className="ticket-detail-main">
          <span className="skeleton ticket-skeleton ticket-skeleton-back" />
          <span className="skeleton ticket-skeleton ticket-skeleton-title" />
          <span className="skeleton ticket-skeleton ticket-skeleton-sub" />
          <section className="panel">
            <span className="skeleton ticket-skeleton ticket-skeleton-line" />
            <span className="skeleton ticket-skeleton ticket-skeleton-line" />
            <span className="skeleton ticket-skeleton ticket-skeleton-line ticket-skeleton-line-short" />
          </section>
        </div>
        <aside className="ticket-detail-side">
          <div className="panel ticket-side-card">
            <span className="skeleton ticket-skeleton ticket-skeleton-line" />
            <span className="skeleton ticket-skeleton ticket-skeleton-line" />
            <span className="skeleton ticket-skeleton ticket-skeleton-line ticket-skeleton-line-short" />
          </div>
        </aside>
      </div>
    )
  }

  if (!ticket) {
    return (
      <section className="panel">
        <h1>Ticket not found</h1>
        <p className="muted">
          {ticketError || 'This ticket could not be found or you are not allowed to view it.'}
        </p>
        <p className="page-action">
          <Link
            className="secondary-btn"
            to={location.pathname.startsWith('/admin/') ? '/admin/dashboard' : '/tickets'}
          >
            <IconArrowLeft size={15} />
            {location.pathname.startsWith('/admin/') ? 'Back to dashboard' : 'Back to tickets'}
          </Link>
        </p>
      </section>
    )
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-detail-main">
        <p className="ticket-back">
          <Link
            className="text-btn"
            to={location.pathname.startsWith('/admin/') ? '/admin/dashboard' : '/tickets'}
          >
            <IconArrowLeft size={15} />
            {location.pathname.startsWith('/admin/') ? 'Back to dashboard' : 'Back to tickets'}
          </Link>
        </p>

        <header className="page-header">
          <div>
            <p className="eyebrow ticket-ref">{ticket.id}</p>
            <h1>{ticket.title}</h1>
            <p className="page-subtitle">
              Created {formatDate(ticket.createdAt)}
            </p>
          </div>
        </header>

        {error && <p className="field-error banner-gap" role="alert">{error}</p>}

        <section className="panel">
          <p className="eyebrow">DESCRIPTION</p>
          <h2 className="section-title">Full details</h2>
          <p className="ticket-description">{ticket.description}</p>
        </section>

        {activity.length > 0 && (
          <section className="panel">
            <p className="eyebrow">TICKET ACTIVITY</p>
            <h2 className="section-title">History</h2>
            <ol className="ticket-timeline">
              {activity.map((event, index) => (
                <li className="ticket-timeline-item" key={`${event.kind}-${index}`}>
                  <span className="ticket-timeline-dot" aria-hidden="true" />
                  <div className="ticket-timeline-body">
                    <div className="ticket-timeline-head">
                      <strong>
                        {event.kind === 'status'
                          ? `Status changed to ${event.status}`
                          : event.assignedTo?.name
                            ? `Assigned to ${event.assignedTo.name}`
                            : 'Ticket unassigned'}
                      </strong>
                      <span>{formatMessageTimestamp(event.changedAt)}</span>
                    </div>
                    <p>
                      {event.kind === 'status'
                        ? `${event.changedBy?.name || 'Staff'} · ${event.changedBy?.role || 'account'}`
                        : `Changed by ${event.changedBy?.name || 'Administrator'}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="panel">
          <p className="eyebrow">TICKET CONVERSATION</p>
          <h2 className="section-title">Messages</h2>

          {conversationError && (
            <p className="field-error" role="alert">{conversationError}</p>
          )}

          {messagesLoading ? (
            <p className="muted" role="status">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <p className="muted conversation-empty">
              No messages yet. Send a message to continue the conversation.
            </p>
          ) : (
            <ol className="ticket-thread">
              {messages.map((item) => {
                const sender = item.sender && typeof item.sender === 'object'
                  ? item.sender
                  : null
                const role = item.senderRole || 'user'
                const senderLabel = sender?.name || `${role[0].toUpperCase()}${role.slice(1)}`
                const isSelf = Boolean(
                  user && sender && String(sender._id) === String(user.id || user._id),
                )
                const bubbleTone = isSelf
                  ? 'ticket-bubble-self'
                  : ['admin', 'support'].includes(role)
                    ? 'ticket-bubble-staff'
                    : ''

                return (
                  <li className={`ticket-bubble ${bubbleTone}`.trim()} key={item._id}>
                    <div className="ticket-bubble-head">
                      <strong>{senderLabel}</strong>
                      <span>{formatMessageTimestamp(item.createdAt)}</span>
                    </div>
                    <p>{item.message}</p>
                  </li>
                )
              })}
            </ol>
          )}

          <form className="ticket-composer" onSubmit={handleSendMessage}>
            <label className="field" htmlFor="ticket-message">
              <span className="field-label">Your message</span>
              <textarea
                id="ticket-message"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                maxLength={2000}
                placeholder="Write a message…"
                required
              />
            </label>
            <div className="ticket-composer-footer">
              <span className="muted">{newMessage.length}/2000</span>
              <button
                className="primary-btn"
                type="submit"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <aside className="ticket-detail-side">
        <div className="panel ticket-side-card">
          <p className="eyebrow">DETAILS</p>
          <div className="ticket-side-rows">
            <div className="ticket-side-row">
              <span className="ticket-side-label">Status</span>
              <span className="ticket-side-value">
                <StatusBadge status={ticket.status} />
              </span>
            </div>
            <div className="ticket-side-row">
              <span className="ticket-side-label">Priority</span>
              <span className="ticket-side-value">
                <PriorityBadge priority={ticket.priority} />
              </span>
            </div>
            <div className="ticket-side-row">
              <span className="ticket-side-label">Category</span>
              <span className="ticket-side-value">
                {ticket.category
                  ? <CategoryBadge category={ticket.category} />
                  : 'Not specified'}
              </span>
            </div>
            <div className="ticket-side-row">
              <span className="ticket-side-label">Assigned agent</span>
              <span className="ticket-side-value">
                {ticket.assignedTo?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          {canUpdateStatus && (
            <div className="ticket-side-row ticket-side-row--stack">
              <span className="ticket-side-label">Update status</span>
              <select
                className="ticket-side-select"
                aria-label="Update ticket status"
                value={ticket.status}
                disabled={updating}
                onChange={handleStatusChange}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
