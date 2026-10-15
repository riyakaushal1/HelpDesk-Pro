import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import {
  IconBook,
  IconInbox,
  IconOpen,
  IconPlus,
  IconProgress,
  IconResolved,
} from '../components/Icons'
import TicketRow from '../components/TicketRow'
import { useTickets } from '../context/TicketContext'
import { getTicketStats } from '../utils/tickets'
import './Overview.css'

const STATUS_ITEMS = [
  { label: 'Open', key: 'open', color: 'open' },
  { label: 'In progress', key: 'inProgress', color: 'progress' },
  { label: 'Resolved', key: 'resolved', color: 'resolved' },
]

function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem('helpdesk_user') || 'null')
    return user?.name?.trim().split(/\s+/)[0] || ''
  } catch {
    return ''
  }
}

function StatCard({ label, value, icon: Icon, tone, loading }) {
  return (
    <article className={`overview-stat overview-stat-${tone}`}>
      <div className="overview-stat-top">
        <span>{label}</span>
        <span className="overview-stat-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
      </div>
      <strong className={loading ? 'overview-stat-loading' : ''}>
        {loading ? ' ' : value}
      </strong>
      <span className="overview-stat-caption">
        {loading ? 'Updating your workspace' : 'Across your workspace'}
      </span>
    </article>
  )
}

export default function Overview() {
  const { tickets, loading, error, refreshTickets } = useTickets()
  const stats = getTicketStats(tickets)
  const recent = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
  const firstName = getUserName()

  return (
    <div className="overview-page">
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <p className="overview-kicker">
            <span className="overview-kicker-dot" />
            YOUR SUPPORT WORKSPACE
          </p>
          <h1>
            {firstName ? `Good to see you, ${firstName}.` : 'Support, in focus.'}
          </h1>
          <p>
            Keep every request, update, and conversation moving in one calm,
            clear place.
          </p>
          <div className="overview-hero-actions">
            <Link className="overview-primary-action" to="/create">
              <IconPlus size={16} />
              Create a ticket
            </Link>
            <Link className="overview-secondary-action" to="/tickets">
              Browse tickets
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <aside className="overview-pulse" aria-label="Ticket status summary">
          <div className="overview-pulse-heading">
            <div>
              <span className="overview-pulse-label">LIVE WORKLOAD</span>
              <strong>{loading ? '—' : stats.total}</strong>
              <span className="overview-pulse-caption">total requests</span>
            </div>
            <span className="overview-pulse-mark" aria-hidden="true">
              <IconInbox size={19} />
            </span>
          </div>

          <div className="overview-status-list">
            {STATUS_ITEMS.map((item) => {
              const count = stats[item.key]
              const width = stats.total ? `${(count / stats.total) * 100}%` : '0%'

              return (
                <div className="overview-status-item" key={item.key}>
                  <div className="overview-status-label">
                    <span className={`overview-status-dot ${item.color}`} />
                    <span>{item.label}</span>
                    <strong>{loading ? '—' : count}</strong>
                  </div>
                  <div
                    className="overview-status-track"
                    role="img"
                    aria-label={`${item.label}: ${loading ? 'loading' : `${count} tickets`}`}
                  >
                    <span
                      className={`overview-status-fill ${item.color}`}
                      style={{ width: loading ? '0%' : width }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="overview-pulse-footnote">
            Status totals reflect tickets currently available to your account.
          </p>
        </aside>
      </section>

      {error && (
        <section className="overview-error" role="alert">
          <div>
            <strong>We couldn’t refresh your tickets.</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={refreshTickets}>Try again</button>
        </section>
      )}

      <section className="overview-stats" aria-label="Ticket statistics">
        <StatCard
          label="All tickets"
          value={stats.total}
          icon={IconInbox}
          tone="total"
          loading={loading}
        />
        <StatCard
          label="Open"
          value={stats.open}
          icon={IconOpen}
          tone="open"
          loading={loading}
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={IconProgress}
          tone="progress"
          loading={loading}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={IconResolved}
          tone="resolved"
          loading={loading}
        />
      </section>

      <section className="overview-content-grid">
        <section className="overview-recent">
          <div className="overview-section-heading">
            <div>
              <p className="overview-section-kicker">THE LATEST</p>
              <h2>Recent tickets</h2>
              <p>Pick up where you left off.</p>
            </div>
            <Link to="/tickets" className="overview-view-all">
              View all <span aria-hidden="true">↗</span>
            </Link>
          </div>

          {loading ? (
            <div className="overview-skeleton-list" role="status" aria-label="Loading recent tickets">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="overview-skeleton-row" key={index}>
                  <span />
                  <div><i /><i /></div>
                  <b />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<IconInbox />}
              title="Your workspace is ready."
              description="Create your first ticket and keep the whole conversation in one place."
              actionLabel="Create your first ticket"
              actionTo="/create"
            />
          ) : (
            <div className="overview-ticket-list">
              {recent.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>

        <aside className="overview-guide-card">
          <span className="overview-guide-icon" aria-hidden="true">
            <IconBook size={18} />
          </span>
          <p className="overview-section-kicker">A LITTLE GUIDANCE</p>
          <h2>Find an answer before you wait.</h2>
          <p>
            Browse practical help articles for common questions and
            troubleshooting.
          </p>
          <Link to="/knowledge" className="overview-guide-link">
            Explore the knowledge base
            <span aria-hidden="true">→</span>
          </Link>
          <span className="overview-guide-decoration" aria-hidden="true">?</span>
        </aside>
      </section>
    </div>
  )
}
