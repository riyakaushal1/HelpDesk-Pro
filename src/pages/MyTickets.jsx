import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { IconInbox, IconPlus, IconSearch } from '../components/Icons'
import TicketRow from '../components/TicketRow'
import { useTickets } from '../context/TicketContext'
import { filterAndSortTickets } from '../utils/tickets'
import './MyTickets.css'

export default function MyTickets() {
  const { tickets } = useTickets()
  const isSupport = (() => {
    try {
      return JSON.parse(localStorage.getItem('helpdesk_user') || 'null')?.role === 'support'
    } catch {
      return false
    }
  })()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sort, setSort] = useState('newest')

  const filteredTickets = useMemo(
    () =>
      filterAndSortTickets(tickets, {
        search,
        status: statusFilter,
        priority: priorityFilter,
        sort,
      }),
    [tickets, search, statusFilter, priorityFilter, sort],
  )

  const hasActiveFilters =
    search.trim() !== '' || statusFilter !== 'All' || priorityFilter !== 'All'

  function clearFilters() {
    setSearch('')
    setStatusFilter('All')
    setPriorityFilter('All')
    setSort('newest')
  }

  return (
    <div className="tickets-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">WORKSPACE / REQUESTS</p>
          <h1>{isSupport ? 'Support Ticket Queue' : 'My Tickets'}</h1>
          <p className="page-subtitle">
          {isSupport
            ? 'Review the shared support queue. Agent assignments track ownership but do not limit support access.'
            : 'Search, filter, and open every request stored in this workspace.'}
          </p>
        </div>
        <div className="tickets-header-actions">
          <div className="tickets-total">
            <span>Total tickets</span>
            <strong>{tickets.length}</strong>
          </div>
          <Link className="primary-btn" to="/create">
            <IconPlus size={15} />
            Create ticket
          </Link>
        </div>
      </header>

      <section className="panel tickets-content">
        <div className="toolbar tickets-toolbar">
          <label className="search-field ticket-search">
            <IconSearch size={16} />
            <input
              type="search"
              placeholder="Search by title, description, or ID"
              aria-label="Search tickets"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="All">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            aria-label="Sort tickets"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className="tickets-table-header">
          <span>REQUEST</span>
          <span>STATUS</span>
          <span>PRIORITY</span>
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            icon={<IconInbox />}
            title="A clean slate."
            description="Your support requests will appear here once tickets are created."
            actionLabel="Create ticket"
            actionTo="/create"
          />
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            icon={<IconSearch />}
            title="No matching tickets."
            description="Try another search term or change your filters."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="ticket-list tickets-list">
            {filteredTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        <footer className="tickets-footer">
          <span>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
          {hasActiveFilters ? (
            <button type="button" className="text-btn" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  )
}
