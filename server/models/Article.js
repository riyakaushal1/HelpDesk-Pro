const mongoose = require('mongoose')
const { ARTICLE_CATEGORIES } = require('../constants')

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

const articleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    category: {
      type: String,
      required: true,
      enum: ARTICLE_CATEGORIES,
    },
    summary: {
      type: String,
      required: [true, 'Summary is required.'],
      trim: true,
      maxlength: 300,
    },
    body: {
      type: [String],
      required: [true, 'Article body is required.'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Article body cannot be empty.',
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

articleSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title)
  }
  next()
})

const Article = mongoose.model('Article', articleSchema)

module.exports = Article
