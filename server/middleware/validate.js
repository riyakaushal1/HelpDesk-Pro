const {
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  ARTICLE_CATEGORIES,
} = require('../constants')

function validateTicket(req, res, next) {
  const { title, description, priority, category } = req.body
  const errors = {}

  if (!title || !title.trim()) {
    errors.title = 'Enter a ticket title.'
  } else if (title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.'
  } else if (title.trim().length > 100) {
    errors.title = 'Title must be 100 characters or fewer.'
  }

  if (!description || !description.trim()) {
    errors.description = 'Describe the issue so it can be understood later.'
  } else if (description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.'
  } else if (description.trim().length > 1000) {
    errors.description = 'Description must be 1,000 characters or fewer.'
  }

  if (!TICKET_PRIORITIES.includes(priority)) {
    errors.priority = 'Choose a valid priority.'
  }

  if (category && !TICKET_CATEGORIES.includes(category)) {
    errors.category = 'Choose a valid category.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors })
  }

  next()
}

function validateStatusUpdate(req, res, next) {
  const { status } = req.body

  if (!TICKET_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${TICKET_STATUSES.join(', ')}`,
    })
  }

  next()
}

function validateTicketAssignment(req, res, next) {
  const agentId = req.body?.agentId

  if (agentId !== null && (
    typeof agentId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(agentId)
  )) {
    return res.status(400).json({
      message: 'Provide a valid support agent ID or null to unassign this ticket.',
    })
  }

  req.body = { agentId }
  return next()
}

function validateTicketMessage(req, res, next) {
  const message = req.body?.message

  if (typeof message !== 'string') {
    return res.status(400).json({ message: 'Message must be text.' })
  }

  const trimmedMessage = message.trim()

  if (!trimmedMessage) {
    return res.status(400).json({ message: 'Message cannot be empty.' })
  }

  if (trimmedMessage.length > 2000) {
    return res.status(400).json({
      message: 'Message must be 2,000 characters or fewer.',
    })
  }

  req.body = { message: trimmedMessage }
  next()
}

function validateArticle(req, res, next) {
  const { title, category, summary, body } = req.body
  const errors = {}

  if (!title || !title.trim()) {
    errors.title = 'Enter an article title.'
  } else if (title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.'
  } else if (title.trim().length > 150) {
    errors.title = 'Title must be 150 characters or fewer.'
  }

  if (!ARTICLE_CATEGORIES.includes(category)) {
    errors.category = 'Choose a valid category.'
  }

  if (!summary || !summary.trim()) {
    errors.summary = 'Enter a short summary.'
  } else if (summary.trim().length > 300) {
    errors.summary = 'Summary must be 300 characters or fewer.'
  }

  const bodyArray = Array.isArray(body) ? body : body ? [body] : []
  if (bodyArray.length === 0) {
    errors.body = 'Article body cannot be empty.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors })
  }

  next()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateSignup(req, res, next) {
  const { name, email, password } = req.body || {}
  const errors = {}

  if (typeof name !== 'string' || !name.trim()) {
    errors.name = 'Enter your full name.'
  } else if (name.trim().length < 2 || name.trim().length > 50) {
    errors.name = 'Name must be between 2 and 50 characters.'
  }

  if (typeof email !== 'string' || !email.trim()) {
    errors.email = 'Enter your email.'
  } else if (!isValidEmail(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (typeof password !== 'string') {
    errors.password = 'Create a password.'
  } else if (password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors })
  }

  req.body = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  }
  next()
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {}
  const errors = {}

  if (typeof email !== 'string' || !email.trim()) {
    errors.email = 'Enter your email.'
  } else if (!isValidEmail(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (typeof password !== 'string' || !password) {
    errors.password = 'Enter your password.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors })
  }

  req.body = { email: email.trim().toLowerCase(), password }
  next()
}

function validateVerificationEmail(req, res, next) {
  const email = req.body?.email
  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    return res.status(400).json({
      message: 'Enter a valid email address.',
    })
  }

  req.body = { email: email.trim().toLowerCase() }
  next()
}

function validateEmailVerification(req, res, next) {
  const { email, code } = req.body || {}
  if (
    typeof email !== 'string' ||
    !isValidEmail(email.trim()) ||
    typeof code !== 'string' ||
    !/^\d{6}$/.test(code)
  ) {
    return res.status(400).json({
      message: 'Enter a valid email address and six-digit verification code.',
    })
  }

  req.body = { email: email.trim().toLowerCase(), code }
  next()
}

function validateSupportAccount(req, res, next) {
  const { name, email, password } = req.body || {}
  const errors = {}

  if (typeof name !== 'string' || !name.trim()) {
    errors.name = 'Enter the support agent’s full name.'
  } else if (name.trim().length < 2 || name.trim().length > 50) {
    errors.name = 'Name must be between 2 and 50 characters.'
  }

  if (typeof email !== 'string' || !email.trim()) {
    errors.email = 'Enter an email address.'
  } else if (!isValidEmail(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (typeof password !== 'string') {
    errors.password = 'Enter an initial password.'
  } else if (password.length < 8) {
    errors.password = 'Use at least 8 characters for the initial password.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  req.body = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  }
  next()
}

function validateSupportAgentStatus(req, res, next) {
  if (typeof req.body?.isActive !== 'boolean') {
    return res.status(400).json({
      message: 'Account status must be true (active) or false (inactive).',
    })
  }

  req.body = { isActive: req.body.isActive }
  next()
}

function validateSupportPromotion(req, res, next) {
  const { email } = req.body || {}

  if (typeof email !== 'string' || !email.trim() || !isValidEmail(email.trim())) {
    return res.status(400).json({
      message: 'Enter the email address of an existing user account.',
    })
  }

  req.body = { email: email.trim().toLowerCase() }
  next()
}

module.exports = {
  validateTicket,
  validateStatusUpdate,
  validateTicketAssignment,
  validateTicketMessage,
  validateArticle,
  validateSignup,
  validateLogin,
  validateSupportAccount,
  validateSupportAgentStatus,
  validateSupportPromotion,
  validateVerificationEmail,
  validateEmailVerification,
}
