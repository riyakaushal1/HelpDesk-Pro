export function StatusBadge({ status }) {
  const tone = {
    Open: 'badge-open',
    'In Progress': 'badge-progress',
    Resolved: 'badge-resolved',
  }[status]

  return <span className={`badge ${tone || ''}`}>{status}</span>
}

export function PriorityBadge({ priority }) {
  const tone = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
  }[priority]

  return <span className={`badge ${tone || ''}`}>{priority}</span>
}

export function CategoryBadge({ category }) {
  if (!category) return null
  return <span className="badge badge-category">{category}</span>
}
