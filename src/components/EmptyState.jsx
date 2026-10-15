import { Link } from 'react-router-dom'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
}) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionTo ? (
        <Link className="secondary-btn" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {onAction ? (
        <button type="button" className="secondary-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
