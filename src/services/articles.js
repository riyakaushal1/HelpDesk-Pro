import { apiRequest } from './api'

function normalizeArticle(article) {
  const body = Array.isArray(article.body)
    ? article.body
    : article.body
      ? [article.body]
      : []

  return {
    ...article,
    id: String(article._id || article.slug),
    body: body.filter(Boolean).map((paragraph) => String(paragraph)),
  }
}

export async function fetchArticles(options = {}) {
  const data = await apiRequest('/articles', options)
  return (data.articles || []).map(normalizeArticle)
}

export async function fetchArticleBySlug(slug, options = {}) {
  const data = await apiRequest(`/articles/${encodeURIComponent(slug)}`, options)

  if (!data || (!data.slug && !data.title && !data._id)) return null

  return normalizeArticle(data)
}
