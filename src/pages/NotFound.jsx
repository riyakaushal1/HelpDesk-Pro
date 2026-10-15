import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="panel">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="muted">That route is not part of HelpDesk Pro.</p>
      <p className="page-action">
        <Link className="primary-btn" to="/">
          Return to overview
        </Link>
      </p>
    </section>
  )
}
