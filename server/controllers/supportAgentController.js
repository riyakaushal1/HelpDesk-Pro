const mongoose = require('mongoose')
const User = require('../models/User')
const {
  assertEmailVerificationConfigured,
  sendVerificationCode,
} = require('../services/emailService')

function toSupportAgent(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
    emailVerificationStatus: user.emailVerified === true
      ? 'verified'
      : user.emailVerified === false
        ? 'pending'
        : 'legacy-unrecorded',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function listSupportAgents(req, res) {
  try {
    const agents = await User.find({ role: 'support' })
      .select('name email role isActive emailVerified createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      count: agents.length,
      agents: agents.map(toSupportAgent),
    })
  } catch (error) {
    console.error('Support agent list error:', error.message)
    return res.status(500).json({
      message: 'Server error while fetching support agents.',
    })
  }
}

async function createSupportAgent(req, res) {
  let agent
  try {
    assertEmailVerificationConfigured()
    agent = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'support',
      isActive: true,
      emailVerified: false,
    })

    await sendVerificationCode(agent)

    return res.status(201).json({
      message: 'Support account created. A verification code was sent to the agent.',
      agent: toSupportAgent(agent),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Support account validation failed.',
        errors: Object.values(error.errors).map((item) => item.message),
      })
    }

    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Email verification is unavailable. Configure email delivery before creating support accounts.',
      })
    }

    if (agent) {
      console.error('Support account verification email could not be sent.', {
        code: error.code || error.name,
      })
      return res.status(503).json({
        message: 'The support account may have been created, but its verification email could not be delivered. Refresh the agent list and resend verification after checking email settings.',
      })
    }

    console.error('Support agent creation error:', error.code || error.name)
    return res.status(500).json({
      message: 'Server error while creating support account.',
    })
  }
}

async function promoteUserToSupport(req, res) {
  try {
    const user = await User.findOneAndUpdate(
      {
        email: req.body.email,
        role: 'user',
        isActive: { $ne: false },
        emailVerified: true,
      },
      { $set: { role: 'support' } },
      { new: true, runValidators: true },
    )

    if (user) {
      return res.json({
        message: 'User promoted to support agent.',
        agent: toSupportAgent(user),
      })
    }

    const existing = await User.findOne({ email: req.body.email })
      .select('role isActive emailVerified')
    if (!existing) {
      return res.status(404).json({ message: 'User account not found.' })
    }

    if (existing.role !== 'user') {
      return res.status(409).json({
        message: 'Only an existing regular user can be promoted.',
      })
    }

    if (existing.emailVerified !== true) {
      return res.status(409).json({
        message: 'Verify the user email before promoting this account.',
      })
    }

    return res.status(409).json({
      message: 'An inactive account cannot be promoted.',
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }

    console.error('Support agent promotion error:', error.message)
    return res.status(500).json({
      message: 'Server error while promoting user.',
    })
  }
}

async function resendSupportAgentVerification(req, res) {
  try {
    assertEmailVerificationConfigured()
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid account ID.' })
    }

    const agent = await User.findOne({
      _id: req.params.id,
      role: 'support',
      emailVerified: { $ne: true },
    }).select('+emailVerificationSentAt')

    if (!agent) {
      return res.status(404).json({
        message: 'Support account was not found or is already verified.',
      })
    }

    const result = await sendVerificationCode(agent)
    return res.status(202).json({
      message: result.sent
        ? 'A verification code was sent to the support agent.'
        : `A verification code was sent recently. Try again in ${result.retryAfterSeconds} seconds.`,
    })
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Email verification is unavailable. Configure email delivery first.',
      })
    }

    console.error('Support verification resend error:', error.code || error.name)
    return res.status(503).json({
      message: 'Could not send a verification email. Please try again later.',
    })
  }
}

async function updateSupportAgentStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid account ID.' })
    }

    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'support' },
      { $set: { isActive: req.body.isActive } },
      { new: true, runValidators: true },
    )

    if (!agent) {
      const existing = await User.findById(req.params.id).select('role')
      if (!existing) {
        return res.status(404).json({ message: 'Support agent not found.' })
      }

      return res.status(409).json({
        message: 'Only support agent accounts can be activated or deactivated.',
      })
    }

    return res.json({
      message: `Support account ${agent.isActive ? 'activated' : 'deactivated'} successfully.`,
      agent: toSupportAgent(agent),
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }

    console.error('Support agent status update error:', error.message)
    return res.status(500).json({
      message: 'Server error while updating support account status.',
    })
  }
}

module.exports = {
  listSupportAgents,
  createSupportAgent,
  promoteUserToSupport,
  resendSupportAgentVerification,
  updateSupportAgentStatus,
}
