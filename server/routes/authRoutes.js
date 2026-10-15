
const express = require('express')

const {
  signup,
  login,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require('../controllers/authController')

const {
  validateSignup,
  validateLogin,
  validateVerificationEmail,
  validateEmailVerification,
} = require('../middleware/validate')

const { protect } = require('../middleware/auth')
const passwordResetRateLimit = require('../middleware/passwordResetRateLimit')
const emailVerificationRateLimit = require('../middleware/emailVerificationRateLimit')

const router = express.Router()

router.post('/signup', emailVerificationRateLimit, validateSignup, signup)
router.post('/login', validateLogin, login)
router.post(
  '/verify-email',
  emailVerificationRateLimit,
  validateEmailVerification,
  verifyEmail,
)
router.post(
  '/resend-verification',
  emailVerificationRateLimit,
  validateVerificationEmail,
  resendEmailVerification,
)
router.get('/me', protect, getCurrentUser)

router.post('/forgot-password', passwordResetRateLimit, forgotPassword)
router.post('/verify-reset-otp', passwordResetRateLimit, verifyResetOtp)
router.post('/reset-password', passwordResetRateLimit, resetPassword)

module.exports = router
