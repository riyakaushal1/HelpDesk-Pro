const STATUSES = ['Open', 'In Progress', 'Resolved']
const PRIORITIES = ['Low', 'Medium', 'High']
const CATEGORIES = ['General', 'Technical', 'Account', 'Billing']

let tickets = [
  {
    id: 'HD-1001',
    title: 'Cannot log in to the dashboard',
    description: 'After entering my email and password, the page just refreshes and I am not logged in. This started happening this morning.',
    priority: 'High',
    category: 'Technical',
    status: 'Open',
    createdAt: '2026-10-10T09:15:00.000Z',
  },
  {
    id: 'HD-1002',
    title: 'Update billing address',
    description: 'I need to change the billing address on my account for the upcoming invoice.',
    priority: 'Low',
    category: 'Billing',
    status: 'In Progress',
    createdAt: '2026-10-11T14:30:00.000Z',
  },
  {
    id: 'HD-1003',
    title: 'Request for API documentation',
    description: 'Where can I find the complete API documentation for the integration endpoints?',
    priority: 'Medium',
    category: 'General',
    status: 'Resolved',
    createdAt: '2026-10-09T11:00:00.000Z',
  },
]

let nextNumber = 1004

function getAll() {
  return tickets
}

function getById(id) {
  return tickets.find((ticket) => ticket.id === id)
}

function create({ title, description, priority, category }) {
  const ticket = {
    id: `HD-${nextNumber++}`,
    title: title.trim(),
    description: description.trim(),
    priority,
    category: category || '',
    status: 'Open',
    createdAt: new Date().toISOString(),
  }
  tickets.unshift(ticket)
  return ticket
}

function updateStatus(id, status) {
  const ticket = tickets.find((t) => t.id === id)
  if (!ticket) return null
  ticket.status = status
  return ticket
}

function remove(id) {
  const index = tickets.findIndex((ticket) => ticket.id === id)
  if (index === -1) return false
  tickets.splice(index, 1)
  return true
}

module.exports = {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  getAll,
  getById,
  create,
  updateStatus,
  remove,
}
