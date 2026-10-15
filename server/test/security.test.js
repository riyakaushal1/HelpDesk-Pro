const test = require('node:test')
const assert = require('node:assert/strict')
const Ticket = require('../models/Ticket')
const User = require('../models/User')
const {
  getTicketById,
  addTicketMessage,
  updateTicketAssignment,
  updateTicketStatus,
} = require('../controllers/ticketController')
const { authorize, protect } = require('../middleware/auth')
const {
  validateSignup,
  validateTicketAssignment,
  validateTicketMessage,
} = require('../middleware/validate')
const {
  promoteUserToSupport,
  updateSupportAgentStatus,
} = require('../controllers/supportAgentController')
const { generateToken } = require('../utils/jwt')
const errorHandler = require('../middleware/errorHandler')

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('signup validation discards role and account-control fields', () => {
  const req = {
    body: {
      name: '  Test User ',
      email: ' TEST@example.com ',
      password: 'long-enough-password',
      role: 'admin',
      isActive: false,
      emailVerified: true,
    },
  }
  const res = responseRecorder()
  let nextCalled = false

  validateSignup(req, res, () => { nextCalled = true })

  assert.equal(nextCalled, true)
  assert.deepEqual(req.body, {
    name: 'Test User',
    email: 'test@example.com',
    password: 'long-enough-password',
  })
})

test('ticket message validation trims content and rejects blank or oversized messages', () => {
  const validReq = { body: { message: '  Please help  ', sender: 'spoofed' } }
  let nextCalled = false
  validateTicketMessage(validReq, responseRecorder(), () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.deepEqual(validReq.body, { message: 'Please help' })

  const blankRes = responseRecorder()
  validateTicketMessage(
    { body: { message: '  ' } },
    blankRes,
    () => assert.fail('Blank message must be rejected'),
  )
  assert.equal(blankRes.statusCode, 400)

  const longRes = responseRecorder()
  validateTicketMessage(
    { body: { message: 'x'.repeat(2001) } },
    longRes,
    () => assert.fail('Oversized message must be rejected'),
  )
  assert.equal(longRes.statusCode, 400)
})

test('assignment validation accepts unassignment but rejects malformed IDs', () => {
  const req = { body: { agentId: '64f123456789012345678901', assignedTo: 'spoofed' } }
  let nextCalled = false
  validateTicketAssignment(req, responseRecorder(), () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body, { agentId: '64f123456789012345678901' })

  const unassignReq = { body: { agentId: null, changedBy: 'spoofed' } }
  validateTicketAssignment(unassignReq, responseRecorder(), () => {})
  assert.deepEqual(unassignReq.body, { agentId: null })

  const invalidRes = responseRecorder()
  validateTicketAssignment(
    { body: { agentId: 'not-an-object-id' } },
    invalidRes,
    () => assert.fail('Malformed ID must be rejected'),
  )
  assert.equal(invalidRes.statusCode, 400)
})

test('admin-only authorization rejects users and accepts admins', () => {
  const onlyAdmin = authorize('admin')
  const userRes = responseRecorder()
  let called = false
  onlyAdmin({ user: { role: 'user' } }, userRes, () => { called = true })
  assert.equal(userRes.statusCode, 403)
  assert.equal(called, false)

  const adminRes = responseRecorder()
  onlyAdmin({ user: { role: 'admin' } }, adminRes, () => { called = true })
  assert.equal(called, true)
})

test('ticket detail query scopes ordinary users to their own tickets', async (t) => {
  const originalFindOne = Ticket.findOne
  t.after(() => { Ticket.findOne = originalFindOne })
  let query
  Ticket.findOne = async (filter) => {
    query = filter
    return null
  }

  const res = responseRecorder()
  await getTicketById(
    {
      params: { id: '64f123456789012345678901' },
      user: { id: 'owner-id', role: 'user' },
    },
    res,
  )

  assert.deepEqual(query, {
    _id: '64f123456789012345678901',
    createdBy: 'owner-id',
  })
  assert.equal(res.statusCode, 404)
})

test('support replies use authenticated sender identity, not request fields', async (t) => {
  const originalFindOne = Ticket.findOne
  t.after(() => { Ticket.findOne = originalFindOne })

  const ticket = {
    messages: [],
    async save() {},
    async populate() { return this },
  }
  let query
  Ticket.findOne = async (filter) => {
    query = filter
    return ticket
  }

  const res = responseRecorder()
  await addTicketMessage(
    {
      params: { id: '64f123456789012345678901' },
      user: { _id: 'trusted-agent-id', id: 'trusted-agent-id', role: 'support' },
      body: {
        message: 'Reply from staff',
        sender: 'spoofed-user-id',
        senderRole: 'admin',
      },
    },
    res,
  )

  assert.deepEqual(query, { _id: '64f123456789012345678901' })
  assert.equal(res.statusCode, 201)
  assert.equal(ticket.messages[0].sender, 'trusted-agent-id')
  assert.equal(ticket.messages[0].senderRole, 'support')
})

test('only administrators can assign a ticket and active verified/legacy agents qualify', async (t) => {
  const originalFindById = Ticket.findById
  const originalFindOne = User.findOne
  t.after(() => {
    Ticket.findById = originalFindById
    User.findOne = originalFindOne
  })

  const ticket = {
    assignedTo: null,
    assignmentHistory: [],
    async save() {},
    async populate() { return this },
  }
  const assignedAgent = { _id: 'support-agent-id', name: 'Agent', role: 'support' }
  let agentQuery
  Ticket.findById = async () => ticket
  User.findOne = (filter) => {
    agentQuery = filter
    return { select: async () => assignedAgent }
  }

  const res = responseRecorder()
  await updateTicketAssignment(
    {
      params: { id: '64f123456789012345678901' },
      body: { agentId: '64f123456789012345678902' },
      user: { _id: 'admin-id', role: 'admin' },
    },
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.equal(ticket.assignedTo, 'support-agent-id')
  assert.equal(ticket.assignmentHistory[0].changedBy, 'admin-id')
  assert.deepEqual(agentQuery.$or, [
    { emailVerified: true },
    { emailVerified: { $exists: false } },
  ])
})

test('staff status updates record the authenticated actor', async (t) => {
  const originalFindOne = Ticket.findOne
  t.after(() => { Ticket.findOne = originalFindOne })
  const ticket = {
    status: 'Open',
    statusHistory: [],
    async save() {},
    async populate() { return this },
  }
  Ticket.findOne = async () => ticket

  const res = responseRecorder()
  await updateTicketStatus(
    {
      params: { id: '64f123456789012345678901' },
      body: { status: 'In Progress' },
      user: { _id: 'support-id', id: 'support-id', role: 'support' },
    },
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.equal(ticket.status, 'In Progress')
  assert.equal(ticket.statusHistory[0].changedBy, 'support-id')
})

test('support management cannot promote an unverified regular account', async (t) => {
  const originalFindOneAndUpdate = User.findOneAndUpdate
  const originalFindOne = User.findOne
  t.after(() => {
    User.findOneAndUpdate = originalFindOneAndUpdate
    User.findOne = originalFindOne
  })

  User.findOneAndUpdate = async () => null
  User.findOne = () => ({
    select: async () => ({
      role: 'user',
      isActive: true,
      emailVerified: false,
    }),
  })

  const res = responseRecorder()
  await promoteUserToSupport({ body: { email: 'person@example.test' } }, res)
  assert.equal(res.statusCode, 409)
  assert.match(res.body.message, /Verify the user email/)
})

test('support account activation is limited to support-role records', async (t) => {
  const originalFindOneAndUpdate = User.findOneAndUpdate
  t.after(() => { User.findOneAndUpdate = originalFindOneAndUpdate })
  let filter
  User.findOneAndUpdate = async (query, update) => {
    filter = query
    assert.deepEqual(update, { $set: { isActive: false } })
    return {
      _id: 'support-id',
      name: 'Support Agent',
      email: 'agent@example.test',
      role: 'support',
      isActive: false,
      emailVerified: true,
    }
  }

  const res = responseRecorder()
  await updateSupportAgentStatus(
    { params: { id: '64f123456789012345678901' }, body: { isActive: false } },
    res,
  )
  assert.deepEqual(filter, {
    _id: '64f123456789012345678901',
    role: 'support',
  })
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.agent.isActive, false)
  assert.equal('password' in res.body.agent, false)
})

test('inactive accounts are blocked by protected routes', async (t) => {
  const originalFindById = User.findById
  t.after(() => { User.findById = originalFindById })
  User.findById = async () => ({
    id: 'inactive-id',
    role: 'support',
    isActive: false,
    emailVerified: true,
  })

  const token = generateToken({
    id: 'inactive-id',
    name: 'Inactive Agent',
    email: 'agent@example.test',
    role: 'support',
  })
  const res = responseRecorder()
  let nextCalled = false

  await protect(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => { nextCalled = true },
  )

  assert.equal(res.statusCode, 403)
  assert.equal(nextCalled, false)
})

test('unexpected server errors do not expose internal details in production', (t) => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }
  })

  const res = responseRecorder()
  errorHandler(
    { status: 500, message: 'private database connection details', stack: 'private stack' },
    {},
    res,
    (error) => { throw error },
  )

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.message, 'An unexpected server error occurred.')
  assert.equal(JSON.stringify(res.body).includes('private'), false)
})
