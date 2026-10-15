const crypto = require('node:crypto')
const nodemailer = require('nodemailer')
const env = require('../config/env')
const User = require('../models/User')

const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
let transporter

function getVerificationSecret() {
  if (
    typeof env.EMAIL_VERIFICATION_SECRET !== 'string' ||
    env.EMAIL_VERIFICATION_SECRET.length < 32
  ) {
    const error = new Error('Email verification secret is not configured.')
    error.code = 'EMAIL_NOT_CONFIGURED'
    throw error
  }

  return env.EMAIL_VERIFICATION_SECRET
}

function getTransporter() {
  const port = Number(env.SMTP_PORT)
  if (
    !env.SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    !env.EMAIL_FROM
  ) {
    const error = new Error('Email delivery is not configured.')
    error.code = 'EMAIL_NOT_CONFIGURED'
    throw error
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    })
  }

  return transporter
}

function assertEmailDeliveryConfigured() {
  getTransporter()
}

function assertEmailVerificationConfigured() {
  getTransporter()
  getVerificationSecret()
}

function hashVerificationCode(email, code) {
  return crypto
    .createHmac('sha256', getVerificationSecret())
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest('hex')
}

async function sendEmail({ to, subject, text }) {
  const mailer = getTransporter()
  return mailer.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
  })
}

async function sendVerificationCode(user) {
  const now = Date.now()
  assertEmailVerificationConfigured()
  const mailer = getTransporter()
  const code = crypto.randomInt(100000, 1000000).toString()
  const codeHash = hashVerificationCode(user.email, code)
  const cooldownCutoff = new Date(now - RESEND_COOLDOWN_MS)

  const claimedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      emailVerified: { $ne: true },
      $or: [
        { emailVerificationSentAt: { $exists: false } },
        { emailVerificationSentAt: { $lte: cooldownCutoff } },
      ],
    },
    {
      $set: {
        emailVerified: false,
        emailVerificationCodeHash: codeHash,
        emailVerificationExpires: new Date(now + VERIFICATION_EXPIRY_MS),
        emailVerificationAttempts: 0,
        emailVerificationSentAt: new Date(now),
      },
    },
    { new: true },
  )

  if (!claimedUser) {
    const lastSentAt = user.emailVerificationSentAt
      ? new Date(user.emailVerificationSentAt).getTime()
      : now
    return {
      sent: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000),
      ),
    }
  }

  try {
    await mailer.sendMail({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: 'HelpDesk Pro email verification code',
      text:
        `Your HelpDesk Pro verification code is: ${code}\n\n` +
        'This code expires in 15 minutes. Do not share this code with anyone.',
    })
  } catch (error) {
    await User.updateOne(
      { _id: user._id, emailVerificationCodeHash: codeHash },
      {
        $unset: {
          emailVerificationCodeHash: 1,
          emailVerificationExpires: 1,
          emailVerificationSentAt: 1,
        },
        $set: { emailVerificationAttempts: 0 },
      },
    )
    throw error
  }

  return { sent: true, retryAfterSeconds: 60 }
}

module.exports = {
  assertEmailDeliveryConfigured,
  assertEmailVerificationConfigured,
  sendEmail,
  sendVerificationCode,
  hashVerificationCode,
}
