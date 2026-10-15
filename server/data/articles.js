const ARTICLE_CATEGORIES = [
  'Getting Started',
  'Account & Access',
  'Troubleshooting',
  'Billing',
]

let articles = [
  {
    slug: 'create-your-first-ticket',
    title: 'Create your first ticket',
    category: 'Getting Started',
    summary: 'How to describe an issue clearly so it is easier to track later.',
    body: [
      'A useful ticket starts with a short title and a complete description. Name the problem in the title, then explain what you expected, what happened, and any steps that led there.',
      'Choose a priority that reflects impact, not urgency of tone. High is for work that is blocked. Medium is for issues that slow you down. Low is for questions and small requests.',
    ],
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    slug: 'navigate-the-workspace',
    title: 'Navigate the workspace',
    category: 'Getting Started',
    summary: 'A short guide to Overview, My Tickets, and Knowledge Base.',
    body: [
      'Overview is a snapshot of ticket volume and recent activity. My Tickets is the full list, with search, filters, and sorting. Create Ticket is a dedicated form with validation.',
      'Use Knowledge Base for product guidance. Articles here are stored in the database and can be managed by administrators.',
    ],
    createdAt: '2026-10-02T09:00:00.000Z',
  },
  {
    slug: 'ticket-not-appearing',
    title: 'A ticket is missing from the list',
    category: 'Troubleshooting',
    summary: 'Check filters, search, and browser storage before assuming data is lost.',
    body: [
      'If a ticket was just created, confirm it on Overview and My Tickets. Both pages read from the same data source.',
      'Search and filters can hide tickets that still exist. Use Clear filters to reset the list.',
    ],
    createdAt: '2026-10-03T09:00:00.000Z',
  },
]

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function getAll() {
  return articles
}

function getBySlug(slug) {
  return articles.find((article) => article.slug === slug)
}

function create({ title, category, summary, body }) {
  let slug = slugify(title)
  let counter = 1
  while (articles.some((a) => a.slug === slug)) {
    slug = `${slugify(title)}-${counter++}`
  }

  const article = {
    slug,
    title: title.trim(),
    category,
    summary: summary.trim(),
    body: Array.isArray(body) ? body : [body],
    createdAt: new Date().toISOString(),
  }
  articles.unshift(article)
  return article
}

function update(slug, { title, category, summary, body }) {
  const article = articles.find((a) => a.slug === slug)
  if (!article) return null

  if (title !== undefined) article.title = title.trim()
  if (category !== undefined) article.category = category
  if (summary !== undefined) article.summary = summary.trim()
  if (body !== undefined) article.body = Array.isArray(body) ? body : [body]

  return article
}

function remove(slug) {
  const index = articles.findIndex((article) => article.slug === slug)
  if (index === -1) return false
  articles.splice(index, 1)
  return true
}

module.exports = {
  ARTICLE_CATEGORIES,
  getAll,
  getBySlug,
  create,
  update,
  remove,
}
