import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CategoryBadge } from '../components/Badge'
import { IconArrowLeft } from '../components/Icons'
import { articles as seedArticles } from '../data/articles'
import { fetchArticleBySlug } from '../services/articles'
import './Knowledge.css'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

export default function ArticleDetail() {
  const { slug } = useParams()
  const [record, setRecord] = useState({
    slug: null,
    article: null,
    status: 'loading',
  })

  useEffect(() => {
    const controller = new AbortController()

    function applySeedFallback() {
      const fallback = seedArticles.find((item) => item.slug === slug) || null
      setRecord({
        slug,
        article: fallback,
        status: fallback ? 'ready' : 'missing',
      })
    }

    fetchArticleBySlug(slug, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return

        if (data) {
          setRecord({ slug, article: data, status: 'ready' })
        } else {
          applySeedFallback()
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError' || controller.signal.aborted) return
        applySeedFallback()
      })

    return () => controller.abort()
  }, [slug])

  const isCurrent = record.slug === slug
  const status = isCurrent ? record.status : 'loading'
  const article = isCurrent ? record.article : null

  if (status === 'loading') {
    return (
      <div className="article-detail">
        <div className="article-detail-main">
          <div className="card kb-skeleton-card" role="status" aria-label="Loading article">
            <span className="skeleton kb-skeleton-badge" />
            <span className="skeleton kb-skeleton-title" />
            <span className="skeleton kb-skeleton-text" />
            <span className="skeleton kb-skeleton-text" />
            <span className="skeleton kb-skeleton-text-sm" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'missing' || !article) {
    return (
      <section className="panel">
        <h1>Article not found</h1>
        <p className="muted">That guide is not available in the knowledge base.</p>
        <p className="page-action">
          <Link className="secondary-btn" to="/knowledge">
            <IconArrowLeft size={15} />
            Back to articles
          </Link>
        </p>
      </section>
    )
  }

  const paragraphs = Array.isArray(article.body) ? article.body : []
  const updated = formatDate(article.updatedAt || article.createdAt)

  return (
    <article className="article-detail">
      <div className="article-detail-main">
        <p className="article-back">
          <Link className="text-btn" to="/knowledge">
            <IconArrowLeft size={15} />
            Back to articles
          </Link>
        </p>

        <header className="page-header">
          <div>
            <p className="eyebrow">KNOWLEDGE BASE</p>
            <h1>{article.title}</h1>
            <p className="page-subtitle">{article.summary}</p>
          </div>
        </header>

        <div className="article-detail-meta">
          <CategoryBadge category={article.category} />
          {updated ? <span className="muted">Updated {updated}</span> : null}
        </div>

        <div className="article-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <aside className="article-detail-aside">
        <div className="card article-aside-card">
          <p className="eyebrow">ABOUT THIS ARTICLE</p>
          <p className="muted">
            Filed under <strong>{article.category}</strong>.
          </p>
          {updated ? <p className="muted">Last updated {updated}.</p> : null}
          <Link className="text-btn" to="/knowledge">
            Browse all articles
          </Link>
        </div>
      </aside>
    </article>
  )
}
