const express = require('express')
const { getHealth, getRoot } = require('../controllers/healthController')

const router = express.Router()

router.get('/', getRoot)
router.get('/health', getHealth)

module.exports = router
