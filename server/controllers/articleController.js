const Article = require('../models/Article')

async function getAllArticles(req, res) {
  try {
    const articles = await Article.find().sort({ createdAt: -1 })
    res.json({ count: articles.length, articles })
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching articles.' })
  }
}

async function getArticleBySlug(req, res) {
  try {
    const article = await Article.findOne({ slug: req.params.slug })
    if (!article) {
      return res
        .status(404)
        .json({ message: `Article "${req.params.slug}" not found.` })
    }
    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching article.' })
  }
}

async function createArticle(req, res) {
  try {
    const article = await Article.create({
      ...req.body,
      author: req.user.id,
    })
    res.status(201).json({ message: 'Article created.', article })
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: 'An article with this slug already exists.' })
    }
    res.status(500).json({ message: 'Server error while creating article.' })
  }
}

async function updateArticle(req, res) {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true },
    )
    if (!article) {
      return res
        .status(404)
        .json({ message: `Article "${req.params.slug}" not found.` })
    }
    res.json({ message: 'Article updated.', article })
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating article.' })
  }
}

async function deleteArticle(req, res) {
  try {
    const article = await Article.findOneAndDelete({ slug: req.params.slug })
    if (!article) {
      return res
        .status(404)
        .json({ message: `Article "${req.params.slug}" not found.` })
    }
    res.json({ message: `Article "${req.params.slug}" deleted.` })
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting article.' })
  }
}

module.exports = {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
}
