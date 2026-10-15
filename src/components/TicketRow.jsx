import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from './Badge'
import { formatDate } from '../utils/tickets'

export default function TicketRow({ ticket }) {
  return (
    <Link className="ticket-row" to={`/tickets/${ticket.id}`}>
      <div className="ticket-info">
        <strong>{ticket.title}</strong>
        <p>
          {ticket.id} · {formatDate(ticket.createdAt)}
          {ticket.category ? ` · ${ticket.category}` : ''}
          {ticket.assignedTo?.name ? ` · Assigned to ${ticket.assignedTo.name}` : ''}
        </p>
      </div>
      <StatusBadge status={ticket.status} />
      <PriorityBadge priority={ticket.priority} />
    </Link>
  )
}
