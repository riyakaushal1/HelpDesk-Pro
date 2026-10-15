import { Fragment, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTickets } from '../context/TicketContext'
import {
  IconBook,
  IconLogout,
  IconOverview,
  IconPlus,
  IconTickets,
} from '../components/Icons'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: IconOverview, end: true },
      { to: '/tickets', label: 'My Tickets', icon: IconTickets, badge: 'open' },
      { to: '/create', label: 'Create Ticket', icon: IconPlus },
    ],
  },
  {
    label: 'Resources',
    items: [{ to: '/knowledge', label: 'Knowledge Base', icon: IconBook }],
  },
]

function getCrumbs(pathname) {
  if (pathname.startsWith('/tickets/') && pathname !== '/tickets') {
    return ['Workspace', 'My Tickets', 'Ticket']
  }
  if (pathname === '/tickets') return ['Workspace', 'My Tickets']
  if (pathname === '/create') return ['Workspace', 'Create Ticket']
  if (pathname.startsWith('/knowledge/')) {
    return ['Resources', 'Knowledge Base', 'Article']
  }
  if (pathname === '/knowledge') return ['Resources', 'Knowledge Base']
  return ['Workspace', 'Overview']
}

function getSavedUser() {
  try {
    const user = localStorage.getItem('helpdesk_user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const crumbs = getCrumbs(location.pathname)
  const { clearTickets, tickets } = useTickets()

  const [user, setUser] = useState(getSavedUser)

  const openCount = tickets.filter((ticket) => ticket.status === 'Open').length

  function handleLogout() {
    localStorage.removeItem('helpdesk_token')
    localStorage.removeItem('helpdesk_user')
    clearTickets()
    setUser(null)
    navigate('/login')
  }

  const displayName = user?.name || user?.email || 'Guest'
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Not signed in'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <NavLink className="brand" to="/" aria-label="HelpDesk Pro home">
            <span className="brand-mark" aria-hidden="true">
              H
            </span>
            <span className="brand-word">
              HelpDesk <em>Pro</em>
            </span>
          </NavLink>
        </div>

        <nav className="navigation" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <Fragment key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                >
                  <Icon size={17} />
                  {label}
                  {badge === 'open' && openCount > 0 ? (
                    <span className="nav-badge">{openCount}</span>
                  ) : null}
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p className="workspace-note">
            <span className="online-dot" aria-hidden="true" />
            HelpDesk Pro workspace
          </p>

          <div className="account">
            <div className="account-avatar" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="account-meta">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </div>
          </div>

          {user ? (
            <button type="button" className="sidebar-action" onClick={handleLogout}>
              <IconLogout size={15} />
              Log out
            </button>
          ) : (
            <NavLink className="sidebar-action" to="/login">
              Sign in
            </NavLink>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              {crumbs.map((crumb, index) => (
                <Fragment key={`${crumb}-${index}`}>
                  {index > 0 ? <span className="crumb-sep">/</span> : null}
                  <span className={index === crumbs.length - 1 ? 'crumb-current' : ''}>
                    {crumb}
                  </span>
                </Fragment>
              ))}
            </nav>
          </div>

          <div className="topbar-right">
            {user ? (
              <>
                <div className="topbar-identity">
                  <span className="account-avatar" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    Signed in as <strong>{displayName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-btn btn-sm"
                  onClick={handleLogout}
                >
                  <IconLogout size={14} />
                  Log out
                </button>
              </>
            ) : (
              <NavLink className="primary-btn btn-sm" to="/login">
                Sign in
              </NavLink>
            )}
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
