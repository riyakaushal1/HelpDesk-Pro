
const express = require('express')

const {
  getAllTickets,
  getTicketById,
  getTicketMessages,
  addTicketMessage,
  createTicket,
  updateTicketStatus,
  updateTicketAssignment,
  deleteTicket,
} = require('../controllers/ticketController')

const {
  validateTicket,
  validateStatusUpdate,
  validateTicketAssignment,
  validateTicketMessage,
} = require('../middleware/validate')

const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// All ticket routes require login
router.use(protect)

// Logged-in users can view tickets they are allowed to access
router.get('/', getAllTickets)
router.get('/:id/messages', getTicketMessages)
router.post('/:id/messages', validateTicketMessage, addTicketMessage)
router.get('/:id', getTicketById)

// Logged-in users can create tickets
router.post('/', validateTicket, createTicket)

// Only support agents and admins can update ticket status
router.patch(
  '/:id/status',
  authorize('support', 'admin'),
  validateStatusUpdate,
  updateTicketStatus,
)

// Only admins can assign or unassign support agents.
router.patch(
  '/:id/assignment',
  authorize('admin'),
  validateTicketAssignment,
  updateTicketAssignment,
)

// Only admins can delete tickets
router.delete(
  '/:id',
  authorize('admin'),
  deleteTicket,
)

module.exports = router
