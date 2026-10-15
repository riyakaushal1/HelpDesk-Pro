
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTickets } from '../context/TicketContext'
import { apiRequest } from '../services/api'
import './Admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { clearTickets } = useTickets()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [updatingId, setUpdatingId] = useState('')
  const [assigningId, setAssigningId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [agents, setAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [agentsError, setAgentsError] = useState('')
  const [agentsMessage, setAgentsMessage] = useState('')
  const [agentBusy, setAgentBusy] = useState('')
  const [promotionEmail, setPromotionEmail] = useState('')
  const [agentForm, setAgentForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('helpdesk_user') || 'null')
    } catch {
      return null
    }
  })()

  const logout = useCallback(() => {
    localStorage.removeItem('helpdesk_token')
    localStorage.removeItem('helpdesk_user')
    clearTickets()
    navigate('/admin/login', { replace: true })
  }, [clearTickets, navigate])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/tickets')
      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      if (/unauthorized|token|access denied|not authorized/i.test(err.message)) {
        logout()
        return
      }
      setError(err.message || 'Unable to load tickets.')
    } finally {
      setLoading(false)
    }
  }, [logout])

  const loadAgents = useCallback(async () => {
    setAgentsLoading(true)
    setAgentsError('')

    try {
      const data = await apiRequest('/admin/support-agents')
      setAgents(Array.isArray(data.agents) ? data.agents : [])
    } catch (err) {
      setAgentsError(err.message || 'Unable to load support agents.')
    } finally {
      setAgentsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    apiRequest('/tickets')
      .then((data) => {
        if (active) setTickets(Array.isArray(data.tickets) ? data.tickets : [])
      })
      .catch((err) => {
        if (!active) return
        if (/unauthorized|token|access denied|not authorized/i.test(err.message)) {
          logout()
        } else {
          setError(err.message || 'Unable to load tickets.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    apiRequest('/admin/support-agents')
      .then((data) => {
        if (active) setAgents(Array.isArray(data.agents) ? data.agents : [])
      })
      .catch((err) => {
        if (active) setAgentsError(err.message || 'Unable to load support agents.')
      })
      .finally(() => {
        if (active) setAgentsLoading(false)
      })

    return () => { active = false }
  }, [logout])

  async function createSupportAccount(event) {
    event.preventDefault()
    setAgentBusy('create')
    setAgentsError('')
    setAgentsMessage('')

    try {
      const data = await apiRequest('/admin/support-agents', {
        method: 'POST',
        body: JSON.stringify(agentForm),
      })
      setAgents((current) => [
        data.agent,
        ...current.filter((agent) => agent.id !== data.agent.id),
      ])
      setAgentForm({ name: '', email: '', password: '' })
      setAgentsMessage(data.message || 'Support account created.')
    } catch (err) {
      await loadAgents()
      setAgentsError(err.message || 'Unable to create support account.')
    } finally {
      setAgentBusy('')
    }
  }

  async function promoteExistingUser(event) {
    event.preventDefault()
    setAgentBusy('promote')
    setAgentsError('')
    setAgentsMessage('')

    try {
      const data = await apiRequest('/admin/support-agents/promote', {
        method: 'POST',
        body: JSON.stringify({ email: promotionEmail }),
      })
      setAgents((current) => [
        data.agent,
        ...current.filter((agent) => agent.id !== data.agent.id),
      ])
      setPromotionEmail('')
      setAgentsMessage(data.message || 'User promoted to support agent.')
    } catch (err) {
      setAgentsError(err.message || 'Unable to promote user.')
    } finally {
      setAgentBusy('')
    }
  }

  async function changeAgentStatus(agent) {
    setAgentBusy(agent.id)
    setAgentsError('')
    setAgentsMessage('')

    try {
      const data = await apiRequest(
        `/admin/support-agents/${encodeURIComponent(agent.id)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !agent.isActive }),
        },
      )
      setAgents((current) =>
        current.map((item) => item.id === data.agent.id ? data.agent : item),
      )
      setAgentsMessage(data.message || 'Support account status updated.')
    } catch (err) {
      setAgentsError(err.message || 'Unable to update support account.')
    } finally {
      setAgentBusy('')
    }
  }

  async function resendAgentVerification(agent) {
    setAgentBusy(agent.id)
    setAgentsError('')
    setAgentsMessage('')

    try {
      const data = await apiRequest(
        `/admin/support-agents/${encodeURIComponent(agent.id)}/resend-verification`,
        { method: 'POST' },
      )
      setAgentsMessage(data.message || 'Verification email request processed.')
      await loadAgents()
    } catch (err) {
      setAgentsError(err.message || 'Unable to resend verification.')
    } finally {
      setAgentBusy('')
    }
  }

  async function updateStatus(ticketId, status) {
    setUpdatingId(ticketId)
    setError('')

    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId
            ? { ...ticket, ...(data.ticket || {}), status }
            : ticket,
        ),
      )
    } catch (err) {
      setError(err.message || 'Unable to update status.')
    } finally {
      setUpdatingId('')
    }
  }

  async function assignTicket(ticketId, agentId) {
    setAssigningId(ticketId)
    setError('')

    try {
      const data = await apiRequest(`/tickets/${ticketId}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId: agentId || null }),
      })
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId
            ? { ...ticket, ...(data.ticket || {}) }
            : ticket,
        ),
      )
    } catch (err) {
      setError(err.message || 'Unable to assign support agent.')
    } finally {
      setAssigningId('')
    }
  }

  async function deleteTicket(ticketId) {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this ticket?',
    )
    if (!confirmed) return

    setDeletingId(ticketId)
    setError('')

    try {
      await apiRequest(`/tickets/${ticketId}`, { method: 'DELETE' })
      setTickets((current) =>
        current.filter((ticket) => ticket._id !== ticketId),
      )
    } catch (err) {
      setError(err.message || 'Unable to delete ticket.')
    } finally {
      setDeletingId('')
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [ticket.title, ticket.description, ticket.category, ticket.status]
        .some((value) => String(value || '').toLowerCase().includes(query))

    const matchesStatus =
      statusFilter === 'All' || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const openCount = tickets.filter((t) => t.status === 'Open').length
  const progressCount = tickets.filter((t) => t.status === 'In Progress').length
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length
  const assignableAgents = agents.filter(
    (agent) => agent.isActive && agent.emailVerificationStatus !== 'pending',
  )

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-brand-mark">H</div>
          <div>
            <strong className="admin-brand-name">HelpDesk Pro</strong>
            <div className="admin-brand-sub">Administration portal</div>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-role-chip">ADMIN</div>
          <span className="admin-header-name">{user?.name || 'Administrator'}</span>
          <button onClick={logout} className="admin-logout">
            Log out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-welcome">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Monitor support requests and manage ticket status.
            </p>
          </div>

          <button onClick={loadTickets} className="secondary-btn">
            ↻ Refresh tickets
          </button>
        </section>

        {error && (
          <div role="alert" className="admin-error">
            {error}
          </div>
        )}

        <section className="admin-stat-grid">
          <StatCard label="Total tickets" value={tickets.length} symbol="▤" />
          <StatCard label="Open" value={openCount} symbol="◷" />
          <StatCard label="In progress" value={progressCount} symbol="↻" />
          <StatCard label="Resolved" value={resolvedCount} symbol="✓" />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2 className="admin-panel-title">Ticket management</h2>
              <p className="muted">
                Search, review and update support requests.
              </p>
            </div>
            <span className="admin-count">
              {filteredTickets.length} tickets
            </span>
          </div>

          <div className="admin-toolbar">
            <input
              aria-label="Search tickets"
              placeholder="Search title, description or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="admin-spinner">⟳</div>
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <strong>No tickets found</strong>
              <p className="muted">
                Try another search or refresh the ticket list.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Ticket</th>
                    <th className="admin-th">Category</th>
                    <th className="admin-th">Priority</th>
                    <th className="admin-th">Created</th>
                    <th className="admin-th">Assigned agent</th>
                    <th className="admin-th">Status</th>
                    <th className="admin-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="admin-td">
                        <Link
                          to={`/admin/tickets/${encodeURIComponent(String(ticket._id || ticket.id))}`}
                          className="admin-ticket-link"
                        >
                          <strong className="admin-ticket-title">
                            {ticket.title || 'Untitled ticket'}
                          </strong>
                        </Link>
                        <div className="admin-ticket-id">
                          #{String(ticket._id).slice(-6).toUpperCase()}
                        </div>
                        {ticket.description && (
                          <div className="admin-ticket-desc">
                            {ticket.description}
                          </div>
                        )}
                      </td>

                      <td className="admin-td">
                        {ticket.category || 'General'}
                      </td>

                      <td className="admin-td">
                        <span
                          className={`admin-priority admin-priority-${String(ticket.priority || 'medium').toLowerCase()}`}
                        >
                          {ticket.priority || 'Medium'}
                        </span>
                      </td>

                      <td className="admin-td">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="admin-td">
                        <select
                          aria-label={`Assigned agent for ${ticket.title}`}
                          value={ticket.assignedTo?._id || ticket.assignedTo || ''}
                          disabled={assigningId === ticket._id || assignableAgents.length === 0}
                          onChange={(event) =>
                            assignTicket(ticket._id, event.target.value)
                          }
                          className="admin-select admin-select-sm"
                        >
                          <option value="">Unassigned</option>
                          {assignableAgents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                        {assigningId === ticket._id && (
                          <div className="muted">Saving...</div>
                        )}
                      </td>

                      <td className="admin-td">
                        <select
                          aria-label={`Status for ${ticket.title}`}
                          value={ticket.status || 'Open'}
                          disabled={updatingId === ticket._id}
                          onChange={(e) =>
                            updateStatus(ticket._id, e.target.value)
                          }
                          className="admin-select admin-select-sm"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        {updatingId === ticket._id && (
                          <div className="muted">Saving...</div>
                        )}
                      </td>

                      <td className="admin-td">
                        <button
                          disabled={deletingId === ticket._id}
                          onClick={() => deleteTicket(ticket._id)}
                          className="danger-btn btn-sm"
                        >
                          {deletingId === ticket._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel admin-agent-panel">
          <div className="admin-panel-heading">
            <div>
              <h2 className="admin-panel-title">Support agent management</h2>
              <p className="muted">
                Create support accounts, promote existing users, and manage access.
              </p>
            </div>
            <button onClick={loadAgents} className="secondary-btn">
              ↻ Refresh agents
            </button>
          </div>

          <div className="admin-notice">
            New support accounts must verify their email before using support features.
            Existing accounts without recorded verification remain labeled as legacy.
            Ticket access is currently shared across support agents; tickets are not
            assigned to individual agents.
          </div>

          {agentsMessage && (
            <div role="status" className="admin-success">{agentsMessage}</div>
          )}
          {agentsError && (
            <div role="alert" className="admin-error">{agentsError}</div>
          )}

          <div className="admin-agent-forms">
            <form onSubmit={createSupportAccount} className="admin-agent-form">
              <h3 className="admin-form-title">Create support account</h3>
              <label className="field field-label">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={50}
                  value={agentForm.name}
                  onChange={(event) =>
                    setAgentForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="field field-label">
                Email
                <input
                  required
                  type="email"
                  value={agentForm.email}
                  onChange={(event) =>
                    setAgentForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="field field-label">
                Initial password
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={agentForm.password}
                  onChange={(event) =>
                    setAgentForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <button
                type="submit"
                disabled={agentBusy !== ''}
                className="primary-btn"
              >
                {agentBusy === 'create' ? 'Creating…' : 'Create account'}
              </button>
            </form>

            <form onSubmit={promoteExistingUser} className="admin-agent-form">
              <h3 className="admin-form-title">Promote existing user</h3>
              <p className="muted">
                Promote an active regular user account by its email address.
              </p>
              <label className="field field-label">
                User email
                <input
                  required
                  type="email"
                  value={promotionEmail}
                  onChange={(event) => setPromotionEmail(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={agentBusy !== ''}
                className="primary-btn"
              >
                {agentBusy === 'promote' ? 'Promoting…' : 'Promote to support'}
              </button>
            </form>
          </div>

          <div className="admin-agent-list-heading">
            <h3 className="admin-form-title">Support accounts</h3>
            <span className="admin-count">{agents.length} agents</span>
          </div>

          {agentsLoading ? (
            <div className="empty-state">Loading support agents…</div>
          ) : agents.length === 0 ? (
            <div className="empty-state">
              <strong>No support agents yet</strong>
              <p className="muted">Create an account or promote an existing user.</p>
            </div>
          ) : (
            <div className="admin-agent-list">
              {agents.map((agent) => (
                <article key={agent.id} className="admin-agent-row">
                  <div>
                    <strong>{agent.name}</strong>
                    <div className="muted">{agent.email}</div>
                  </div>
                  <div className="admin-agent-badges">
                    <span
                      className={agent.isActive
                        ? 'admin-status-chip admin-status-chip-active'
                        : 'admin-status-chip admin-status-chip-inactive'}
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={agent.emailVerificationStatus === 'verified'
                        ? 'admin-status-chip admin-status-chip-active'
                        : 'admin-status-chip admin-status-chip-inactive'}
                    >
                      {agent.emailVerificationStatus === 'verified'
                        ? 'Email verified'
                        : agent.emailVerificationStatus === 'legacy-unrecorded'
                          ? 'Legacy · unrecorded'
                          : 'Email pending'}
                    </span>
                  </div>
                  <div className="admin-agent-actions">
                    {agent.emailVerificationStatus !== 'verified' && (
                      <button
                        type="button"
                        disabled={agentBusy !== ''}
                        onClick={() => resendAgentVerification(agent)}
                        className="secondary-btn btn-sm"
                      >
                        {agentBusy === agent.id ? 'Sending…' : 'Resend verification'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={agentBusy !== ''}
                      onClick={() => changeAgentStatus(agent)}
                      className={agent.isActive ? 'danger-btn btn-sm' : 'primary-btn btn-sm'}
                    >
                      {agentBusy === agent.id
                        ? 'Saving…'
                        : agent.isActive
                          ? 'Deactivate'
                          : 'Reactivate'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="admin-footer">
          HelpDesk Pro · Admin workspace
        </footer>
      </main>
    </div>
  )
}

function StatCard({ label, value, symbol }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-icon">{symbol}</span>
      </div>
      <div className="admin-stat-value">{value}</div>
    </article>
  )
}

