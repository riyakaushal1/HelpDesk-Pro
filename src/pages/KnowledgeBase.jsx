import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { CategoryBadge } from '../components/Badge'
import { IconSearch } from '../components/Icons'
import { ARTICLE_CATEGORIES, articles as seedArticles } from '../data/articles'
import { fetchArticles } from '../services/articles'
import './Knowledge.css'

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    const controller = new AbortController()

    fetchArticles({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return

        if (items.length > 0) {
          setArticles(items)
          setUsingFallback(false)
        } else {
          setArticles(seedArticles)
          setUsingFallback(true)
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError' || controller.signal.aborted) return

        setArticles(seedArticles)
        setUsingFallback(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory = category === 'All' || article.category === category
      const body = Array.isArray(article.body) ? article.body.join(' ') : ''
      const haystack = `${article.title} ${article.summary} ${body}`.toLowerCase()
      const matchesSearch = query === '' || haystack.includes(query)
      return matchesCategory && matchesSearch
    })
  }, [articles, search, category])

  return (
    <div className="kb-page">
      <header className="kb-hero">
        <div className="kb-hero-inner">
          <div className="kb-hero-copy">
            <p className="eyebrow">HELP CENTER</p>
            <h1>Knowledge Base</h1>
            <p className="page-subtitle">
              Practical guides served by the HelpDesk Pro knowledge service.
              Search by title, summary, or content, then narrow the list by
              category to find an answer fast.
            </p>
          </div>

          <div className="kb-hero-actions">
            <label className="search-field kb-search">
              <IconSearch size={16} />
              <input
                type="search"
                value={search}
                placeholder="Search articles"
                aria-label="Search knowledge base"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <p className="kb-count" role="status">
              {loading
                ? 'Loading articles…'
                : `${results.length} ${results.length === 1 ? 'article' : 'articles'}`}
            </p>
          </div>
        </div>
      </header>

      {usingFallback && !loading ? (
        <p className="notice-banner">
          Showing the built-in starter articles while the knowledge service is
          unavailable.
        </p>
      ) : null}

      <div className="kb-toolbar">
        <div className="category-pills" role="tablist" aria-label="Article categories">
          {['All', ...ARTICLE_CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              className={`pill${category === item ? ' active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="article-grid" role="status" aria-label="Loading articles">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="card kb-skeleton-card" key={index}>
              <span className="skeleton kb-skeleton-badge" />
              <span className="skeleton kb-skeleton-title" />
              <span className="skeleton kb-skeleton-text" />
              <span className="skeleton kb-skeleton-text-sm" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<IconSearch />}
          title="No articles match."
          description="Try a different search or choose another category."
          actionLabel="Reset search"
          onAction={() => {
            setSearch('')
            setCategory('All')
          }}
        />
      ) : (
        <div className="article-grid">
          {results.map((article) => (
            <Link
              key={article.slug}
              className="card card-interactive article-card"
              to={`/knowledge/${article.slug}`}
            >
              <CategoryBadge category={article.category} />
              <h3>{article.title}</h3>
              <p className="muted">{article.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
