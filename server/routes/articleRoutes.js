
const express = require('express')

const {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController')

const { validateArticle } = require('../middleware/validate')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// Public routes
router.get('/', getAllArticles)
router.get('/:slug', getArticleBySlug)

// Admin-only routes
router.post(
  '/',
  protect,
  authorize('admin'),
  validateArticle,
  createArticle,
)

router.put(
  '/:slug',
  protect,
  authorize('admin'),
  validateArticle,
  updateArticle,
)

router.delete(
  '/:slug',
  protect,
  authorize('admin'),
  deleteArticle,
)

module.exports = router
