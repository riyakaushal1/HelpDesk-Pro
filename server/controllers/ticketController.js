
const mongoose = require('mongoose')
const Ticket = require('../models/Ticket')
const User = require('../models/User')

function isAdminOrAgent(user) {
  return ['admin', 'support'].includes(user.role)
}

async function getAllTickets(req, res) {
  try {
    const filter = isAdminOrAgent(req.user)
      ? {}
      : { createdBy: req.user.id }

    const tickets = await Ticket.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })

    return res.json({
      count: tickets.length,
      tickets,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while fetching tickets.',
    })
  }
}

async function getTicketById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    const filter = { _id: req.params.id }

    if (!isAdminOrAgent(req.user)) {
      filter.createdBy = req.user.id
    }

    const ticket = await Ticket.findOne(filter)

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    await ticket.populate([
      { path: 'assignedTo', select: 'name' },
      { path: 'statusHistory.changedBy', select: 'name role' },
      { path: 'assignmentHistory.assignedTo', select: 'name' },
      { path: 'assignmentHistory.changedBy', select: 'name role' },
    ])

    return res.json({ ticket })
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while fetching ticket.',
    })
  }
}

async function getTicketMessages(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    const filter = { _id: req.params.id }

    if (!isAdminOrAgent(req.user)) {
      filter.createdBy = req.user.id
    }

    const ticket = await Ticket.findOne(filter)
      .populate('messages.sender', 'name role')

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    const messages = [...ticket.messages].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return aTime - bTime
    })

    return res.json({ messages })
  } catch {
    return res.status(500).json({
      message: 'Server error while fetching ticket messages.',
    })
  }
}

async function addTicketMessage(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    const filter = { _id: req.params.id }

    if (!isAdminOrAgent(req.user)) {
      filter.createdBy = req.user.id
    }

    const ticket = await Ticket.findOne(filter)

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    ticket.messages.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message: req.body.message,
    })

    await ticket.save()
    await ticket.populate('messages.sender', 'name role')

    return res.status(201).json({
      message: 'Reply added successfully.',
      reply: ticket.messages[ticket.messages.length - 1],
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Server error while adding ticket message.',
    })
  }
}

async function createTicket(req, res) {
  try {
    const { title, description, category, priority } = req.body

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      createdBy: req.user.id,
      statusHistory: [{
        status: 'Open',
        changedBy: req.user.id,
      }],
    })

    return res.status(201).json({
      message: 'Ticket created successfully.',
      ticket,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Ticket validation failed.',
        errors: Object.values(error.errors).map((item) => item.message),
      })
    }

    return res.status(500).json({
      message: 'Server error while creating ticket.',
    })
  }
}

async function updateTicketStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' })
    }

    const filter = { _id: req.params.id }

    // Users can only access their own tickets.
    // Only support/admin should be allowed to update status.
    if (!isAdminOrAgent(req.user)) {
      return res.status(403).json({
        message: 'You are not allowed to update ticket status.',
      })
    }

    const ticket = await Ticket.findOne(filter)

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    if (ticket.status === status) {
      return res.json({
        message: 'Ticket status is unchanged.',
        ticket,
      })
    }

    ticket.status = status
    ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
    })
    await ticket.save()
    await ticket.populate([
      { path: 'assignedTo', select: 'name' },
      { path: 'statusHistory.changedBy', select: 'name role' },
    ])

    return res.json({
      message: 'Ticket status updated successfully.',
      ticket,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Server error while updating ticket.',
    })
  }
}

async function updateTicketAssignment(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    let assignedAgent = null
    if (req.body.agentId !== null) {
      assignedAgent = await User.findOne({
        _id: req.body.agentId,
        role: 'support',
        isActive: { $ne: false },
        $or: [
          { emailVerified: true },
          { emailVerified: { $exists: false } },
        ],
      }).select('name role')

      if (!assignedAgent) {
        return res.status(409).json({
          message: 'The selected support agent is unavailable for assignment.',
        })
      }
    }

    const nextAssigneeId = assignedAgent ? String(assignedAgent._id) : ''
    const currentAssigneeId = ticket.assignedTo
      ? String(ticket.assignedTo._id || ticket.assignedTo)
      : ''

    if (currentAssigneeId === nextAssigneeId) {
      await ticket.populate('assignedTo', 'name')
      return res.json({
        message: 'Ticket assignment is unchanged.',
        ticket,
      })
    }

    ticket.assignedTo = assignedAgent ? assignedAgent._id : null
    ticket.assignmentHistory.push({
      assignedTo: assignedAgent ? assignedAgent._id : null,
      changedBy: req.user._id,
      changedAt: new Date(),
    })
    await ticket.save()
    await ticket.populate([
      { path: 'assignedTo', select: 'name' },
      { path: 'assignmentHistory.assignedTo', select: 'name' },
      { path: 'assignmentHistory.changedBy', select: 'name role' },
    ])

    return res.json({
      message: assignedAgent
        ? 'Ticket assigned successfully.'
        : 'Ticket unassigned successfully.',
      ticket,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Server error while updating ticket assignment.',
    })
  }
}

async function deleteTicket(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ticket ID.' })
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can delete tickets.',
      })
    }

    const ticket = await Ticket.findByIdAndDelete(req.params.id)

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    return res.json({ message: 'Ticket deleted successfully.' })
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while deleting ticket.',
    })
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  getTicketMessages,
  addTicketMessage,
  createTicket,
  updateTicketStatus,
  updateTicketAssignment,
  deleteTicket,
}
