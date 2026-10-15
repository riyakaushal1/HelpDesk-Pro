const express = require('express')
const {
  listSupportAgents,
  createSupportAgent,
  promoteUserToSupport,
  resendSupportAgentVerification,
  updateSupportAgentStatus,
} = require('../controllers/supportAgentController')
const {
  validateSupportAccount,
  validateSupportAgentStatus,
  validateSupportPromotion,
} = require('../middleware/validate')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect, authorize('admin'))

router.get('/support-agents', listSupportAgents)
router.post('/support-agents', validateSupportAccount, createSupportAgent)
router.post(
  '/support-agents/promote',
  validateSupportPromotion,
  promoteUserToSupport,
)
router.post(
  '/support-agents/:id/resend-verification',
  resendSupportAgentVerification,
)
router.patch(
  '/support-agents/:id/status',
  validateSupportAgentStatus,
  updateSupportAgentStatus,
)

module.exports = router
