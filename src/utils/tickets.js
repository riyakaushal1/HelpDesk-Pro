export const STATUSES = ['Open', 'In Progress', 'Resolved']
export const PRIORITIES = ['Low', 'Medium', 'High']
export const CATEGORIES = ['General', 'Technical', 'Account', 'Billing']

export function createTicketId(existingTickets) {
  const numbers = existingTickets.map((ticket) => {
    const match = String(ticket.id || '').match(/^HD-(\d+)$/)
    return match ? Number(match[1]) : 0
  })
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1
  return `HD-${next}`
}

export function isValidTicket(ticket) {
  return (
    ticket &&
    typeof ticket === 'object' &&
    typeof ticket.id === 'string' &&
    typeof ticket.title === 'string' &&
    typeof ticket.description === 'string' &&
    STATUSES.includes(ticket.status) &&
    PRIORITIES.includes(ticket.priority) &&
    typeof ticket.createdAt === 'string'
  )
}

export function formatDate(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getTicketStats(tickets) {
  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'Open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'In Progress').length,
    resolved: tickets.filter((ticket) => ticket.status === 'Resolved').length,
  }
}

export function filterAndSortTickets(tickets, { search, status, priority, sort }) {
  const query = search.trim().toLowerCase()

  const filtered = tickets.filter((ticket) => {
    const haystack = `${ticket.title} ${ticket.description} ${ticket.id}`.toLowerCase()
    const matchesSearch = query === '' || haystack.includes(query)
    const matchesStatus = status === 'All' || ticket.status === status
    const matchesPriority = priority === 'All' || ticket.priority === priority
    return matchesSearch && matchesStatus && matchesPriority
  })

  return [...filtered].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return sort === 'oldest' ? aTime - bTime : bTime - aTime
  })
}

export function validateTicketForm({ title, description, priority, category }) {
  const errors = {}
  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()

  if (!trimmedTitle) {
    errors.title = 'Enter a ticket title.'
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters.'
  } else if (trimmedTitle.length > 100) {
    errors.title = 'Title must be 100 characters or fewer.'
  }

  if (!trimmedDescription) {
    errors.description = 'Describe the issue so it can be understood later.'
  } else if (trimmedDescription.length < 10) {
    errors.description = 'Description must be at least 10 characters.'
  } else if (trimmedDescription.length > 1000) {
    errors.description = 'Description must be 1,000 characters or fewer.'
  }

  if (!PRIORITIES.includes(priority)) {
    errors.priority = 'Choose a priority.'
  }

  if (category && !CATEGORIES.includes(category)) {
    errors.category = 'Choose a valid category.'
  }

  return errors
}
