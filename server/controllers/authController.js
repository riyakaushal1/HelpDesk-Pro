
const User = require('../models/User')
const { generateToken } = require('../utils/jwt')
const crypto = require('node:crypto')
const {
  sendEmail,
  sendVerificationCode,
  hashVerificationCode,
  assertEmailDeliveryConfigured,
  assertEmailVerificationConfigured,
} = require('../services/emailService')

const MAX_PASSWORD_RESET_ATTEMPTS = 5

async function recordFailedPasswordResetAttempt(email) {
  const activeReset = {
    email,
    passwordResetToken: { $exists: true, $ne: null },
    passwordResetExpires: { $gt: new Date() },
  }

  const incrementResult = await User.updateOne(
    {
      ...activeReset,
      $or: [
        { passwordResetAttempts: { $exists: false } },
        { passwordResetAttempts: { $lt: MAX_PASSWORD_RESET_ATTEMPTS - 1 } },
      ],
    },
    { $inc: { passwordResetAttempts: 1 } },
  )

  if (incrementResult.modifiedCount > 0) {
    const user = await User.findOne({ email })
      .select('+passwordResetAttempts')
      .lean()

    return user?.passwordResetAttempts ?? null
  }

  const invalidationResult = await User.updateOne(
    {
      ...activeReset,
      passwordResetAttempts: { $gte: MAX_PASSWORD_RESET_ATTEMPTS - 1 },
    },
    {
      $set: { passwordResetAttempts: MAX_PASSWORD_RESET_ATTEMPTS },
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1,
      },
    },
  )

  if (invalidationResult.modifiedCount > 0) {
    return MAX_PASSWORD_RESET_ATTEMPTS
  }

  return null
}

function getOtpFailureMessage(failedAttempts) {
  if (failedAttempts === null) {
    return 'Invalid or expired OTP. Please request a new code.'
  }

  const remainingAttempts = Math.max(
    MAX_PASSWORD_RESET_ATTEMPTS - failedAttempts,
    0,
  )
  const retryMessage =
    `Incorrect OTP. ${failedAttempts} of ${MAX_PASSWORD_RESET_ATTEMPTS} attempts used; ` +
    `${remainingAttempts} attempts remaining.`

  if (remainingAttempts === 0) {
    return `${retryMessage} Request a new code.`
  }

  return retryMessage
}

const verificationSubmissionMessage =
  'If this address can be registered, a verification code will be sent. Check your inbox and spam folder.'
const resendVerificationMessage =
  'If this account needs email verification, a code will be sent shortly.'

// Signup
async function signup(req, res) {
  let sendingVerification = false
  try {
    const { name, email, password } = req.body

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Name, email and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    assertEmailVerificationConfigured()

    let user = await User.findOne({ email: normalizedEmail })
      .select('+emailVerificationSentAt')

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: 'user',
        emailVerified: false,
      })
    }

    if (user.role === 'user' && user.emailVerified !== true) {
      sendingVerification = true
      await sendVerificationCode(user)
      sendingVerification = false
    }

    return res.status(202).json({ message: verificationSubmissionMessage })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = {}

      for (const field in error.errors) {
        errors[field] = error.errors[field].message
      }

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    if (error.code === 11000) {
      return res.status(202).json({ message: verificationSubmissionMessage })
    }

    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Email verification is temporarily unavailable. Please try again later.',
      })
    }

    if (sendingVerification) {
      console.error('Signup verification email could not be sent.', {
        code: error.code || error.name,
      })
      return res.status(503).json({
        message: 'The verification email could not be sent. Try again or use the resend option.',
      })
    }

    console.error('Signup error:', error.code || error.name)

    return res.status(500).json({
      message: 'Could not complete signup. Please try again.',
    })
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Email and password are required.',
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+password')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'This account has been deactivated. Contact an administrator.',
      })
    }

    const isLegacyStaff =
      ['admin', 'support'].includes(user.role) &&
      user.emailVerified === undefined
    if (user.emailVerified !== true && !isLegacyStaff) {
      return res.status(403).json({
        message: 'Email verification required. Verify your email before signing in.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
      })
    }

    const token = generateToken(user)

    return res.json({
      message: 'Login successful.',
      user,
      token,
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Server error during login.',
    })
  }
}

async function verifyEmail(req, res) {
  try {
    const email = req.body.email.trim().toLowerCase()
    const codeHash = hashVerificationCode(email, req.body.code)
    const canAttempt = {
      $or: [
        { emailVerificationAttempts: { $exists: false } },
        { emailVerificationAttempts: { $lt: 5 } },
      ],
    }

    const user = await User.findOneAndUpdate(
      {
        email,
        emailVerified: { $ne: true },
        emailVerificationCodeHash: codeHash,
        emailVerificationExpires: { $gt: new Date() },
        ...canAttempt,
      },
      {
        $set: { emailVerified: true, emailVerificationAttempts: 0 },
        $unset: {
          emailVerificationCodeHash: 1,
          emailVerificationExpires: 1,
          emailVerificationSentAt: 1,
        },
      },
      { new: true, runValidators: true },
    ).select('emailVerified')

    if (!user) {
      await User.updateOne(
        { email, emailVerified: { $ne: true }, ...canAttempt },
        { $inc: { emailVerificationAttempts: 1 } },
      )
      return res.status(400).json({
        message: 'The verification code is invalid or expired. Request a new code and try again.',
      })
    }

    return res.json({
      message: 'Email verified successfully. You can now sign in.',
    })
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Email verification is temporarily unavailable. Please try again later.',
      })
    }

    console.error('Email verification error:', error.code || error.name)
    return res.status(500).json({
      message: 'Could not verify the email. Please try again.',
    })
  }
}

async function resendEmailVerification(req, res) {
  try {
    assertEmailVerificationConfigured()
    const email = req.body.email.trim().toLowerCase()
    const user = await User.findOne({ email })
      .select('+emailVerificationSentAt')

    if (
      user &&
      ['user', 'support'].includes(user.role) &&
      user.emailVerified !== true
    ) {
      await sendVerificationCode(user)
    }

    return res.status(202).json({ message: resendVerificationMessage })
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Email verification is temporarily unavailable. Please try again later.',
      })
    }

    console.error('Email verification resend error:', error.code || error.name)
    return res.status(503).json({
      message: 'A verification email could not be sent. Please try again later.',
    })
  }
}

// Get current logged-in user
async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    return res.json({ user })
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while fetching user.',
    })
  }
}

// Send a six-digit OTP to the registered email
async function forgotPassword(req, res) {
  const genericMessage =
    'If an account exists for this email, a password reset code will be sent. If it does not arrive, check your spam folder or contact support.'

  try {
    const email = req.body.email?.trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        message: 'Please enter your registered email.',
      })
    }

    try {
      assertEmailDeliveryConfigured()
    } catch (error) {
      if (error.code !== 'EMAIL_NOT_CONFIGURED') throw error
      console.error('Password reset email configuration is missing.')

      return res.json({ message: genericMessage })
    }

    const user = await User.findOne({ email })

    // Do not reveal whether an email is registered
    if (!user) {
      return res.json({ message: genericMessage })
    }

    // Generate a cryptographically secure six-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString()

    // Store only the hashed OTP
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex')

    // OTP expires in ten minutes
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.passwordResetAttempts = 0

    await user.save()

    try {
      await sendEmail({
        to: user.email,
        subject: 'HelpDesk Pro - Password Reset Code',
        text:
          `Your HelpDesk Pro password reset code is: ${otp}\n\n` +
          'This code expires in 10 minutes.\n' +
          'If you did not request a password reset, you can ignore this email.',
      })
    } catch (emailError) {
      // Clear the OTP if the email could not be sent
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      user.passwordResetAttempts = 0
      await user.save()

      console.error('Password reset email could not be sent.', {
        code: emailError.code,
        responseCode: emailError.responseCode,
      })

      return res.json({ message: genericMessage })
    }

    return res.json({ message: genericMessage })
  } catch {
    console.error('Forgot password request failed.')

    return res.json({ message: genericMessage })
  }
}

// Verify the six-digit OTP
async function verifyResetOtp(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const { otp } = req.body

    if (
      !email ||
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        message: 'Please enter a valid email and six-digit OTP.',
      })
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex')

    const user = await User.findOne({
      email,
      passwordResetToken: hashedOtp,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires')

    if (!user) {
      const failedAttempts = await recordFailedPasswordResetAttempt(email)

      return res.status(400).json({
        message: getOtpFailureMessage(failedAttempts),
      })
    }

    return res.json({
      message: 'OTP verified successfully.',
    })
  } catch (error) {
    console.error('OTP verification error:', error.message)

    return res.status(500).json({
      message: 'Could not verify the OTP. Please try again.',
    })
  }
}

// Reset password using the email and verified OTP
async function resetPassword(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const { otp, password, confirmPassword } = req.body

    if (
      !email ||
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp) ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Enter a valid email, OTP and password of at least 8 characters.',
      })
    }

    if (
      typeof confirmPassword !== 'string' ||
      password !== confirmPassword
    ) {
      return res.status(400).json({
        message: 'Passwords do not match.',
      })
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex')

    const user = await User.findOne({
      email,
      passwordResetToken: hashedOtp,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires')

    if (!user) {
      const failedAttempts = await recordFailedPasswordResetAttempt(email)

      return res.status(400).json({
        message: getOtpFailureMessage(failedAttempts),
      })
    }

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.passwordResetAttempts = 0

    // The User model's save hook hashes the new password
    await user.save()

    return res.json({
      message: 'Password reset successful. Please log in with your new password.',
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.',
      })
    }

    console.error('Reset password error:', error.message)

    return res.status(500).json({
      message: 'Could not reset the password. Please try again.',
    })
  }
}

module.exports = {
  signup,
  login,
  verifyEmail,
  resendEmailVerification,
  getCurrentUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
}
