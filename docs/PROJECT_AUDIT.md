# HelpDesk Pro Project Audit

**Audit date:** 2026-10-15  
**Scope:** Existing workspace source and package configuration. No database, email provider, or deployment service was contacted.

## Project shape

- Frontend: React 19, React Router 7, Vite, plain CSS.
- Backend: Express 5, Mongoose 9, MongoDB, JWT, bcryptjs, and Nodemailer.
- Main frontend areas: `src/pages`, `src/components`, `src/context`, `src/layouts`, and `src/services`.
- Main backend areas: `server/routes`, `server/controllers`, `server/models`, `server/middleware`, `server/config`, and `server/services`.
- The ticket model stores messages as timestamped embedded documents. Assignment and status history are not modeled.
- No first-party automated test files were found. The server `test` script is a placeholder.
- Secrets and environment files are ignored by Git rules, and `server/.env.example` contains variable names/placeholders. A root `.env.example` was absent at audit time.
- The workspace is not a Git repository, so a Git diff/status cannot be used to establish pre-existing local changes.

## Feature inventory

| Feature | Status | Evidence / current behavior |
|---|---|---|
| Public signup and role assignment | Implemented but needs testing | Signup validation keeps only name, email, and password; controller explicitly assigns `user`. |
| Login, JWT, password hashing | Implemented but needs testing | Passwords use bcryptjs; login issues a JWT and checks account activation and email verification. |
| Email verification and password recovery | Implemented but needs testing | OTP and resend endpoints use Nodemailer SMTP configuration. No real delivery or full integration flow has been verified in this audit. |
| Backend authentication and roles | Implemented but needs testing | `protect` reloads the user record; `authorize` checks roles; admin management routes are admin-only. |
| Ticket creation, list, detail, status, delete | Implemented but needs testing | Controllers scope ordinary users to their own tickets; staff can see all; status updates are restricted to staff; deletion is admin-only. |
| Ticket conversations | Implemented but needs testing | Message bodies are trimmed and limited; sender ID/role come from `req.user`; reads and writes apply ticket access filtering. |
| Support-agent management | Implemented but needs testing | Admin routes list/create/promote/activate/deactivate agents and resend verification. |
| Knowledge base | Implemented but needs testing | Public article reads and admin-only create/update/delete routes use persisted Mongoose records. |
| Ticket assignment | Implemented but needs testing | Admins can assign, reassign, or unassign active verified/legacy support accounts. Assignment is accountability metadata; support access remains shared across tickets. |
| Ticket status history | Implemented but needs testing | New tickets get an initial status event and future staff status changes record actor/time. Existing tickets are not backfilled. |
| General audit events | Missing | There is no separate audit-event collection for all sensitive operations. |
| Server-side ticket filtering and pagination | Missing | User/admin search and some filtering happen in the browser after fetching the full ticket list. |
| Dashboard charts and operational analytics | Missing | Count cards exist, but there are no chart or trend APIs. |
| Ticket reply/status email notifications | Missing | Email service currently supports account verification and password recovery, not ticket lifecycle events. |
| AI categorization, summaries, or drafting | Missing | No provider integration is present. |
| Responsive and accessibility foundations | Implemented but needs testing | Shared styles include responsive breakpoints, focus-visible outlines, and reduced-motion support. Admin uses separate inline styles; no automated accessibility or viewport testing is configured. |
| Automated application tests | Missing | No application-owned test files or usable backend test runner are configured. |

## Risks and limitations verified

1. **Production JWT fallback:** backend configuration had a known fallback secret if `JWT_SECRET` was absent, including in production.
2. **Unrestricted CORS:** Express used `cors()` without an origin policy.
3. **Fixed frontend API host:** the browser API helper pointed directly to `http://localhost:5000/api`, preventing clean same-origin or hosted API configuration.
4. **Global DNS override:** the server and two role-maintenance scripts replaced the operating system's DNS servers with public resolvers. This can interfere with local/corporate DNS and conceal network configuration issues; it is not an Atlas network fix.
5. **Error disclosure:** the Express error handler returned raw error messages to clients, including in production.
6. **Body size:** JSON parsing used the Express default without a project-specific small request limit.
7. **In-memory rate limits:** verification/password-reset limits do not coordinate across multiple server instances and login has no corresponding limiter.
8. **Existing account transition:** legacy admin/support records without an `emailVerified` field are permitted by the current compatibility exception. Existing regular users are not silently verified. Fake test addresses need a targeted development/migration plan; do not bulk-mark records verified.
9. **Support access policy:** all active support agents currently share access to all tickets. No assignment system exists.
10. **Infrastructure status:** MongoDB Atlas connectivity and real SMTP delivery were not tested. Atlas IP/network configuration was not changed.

## Baseline checks

Executed in this workspace:

- `npm run build` — passed.
- `npx eslint src` — passed.
- `npm run lint` — failed because the root ESLint configuration applied browser globals to backend CommonJS files.
- `Set-Location server; npm test` — failed because the configured test script intentionally exits with “no test specified.”
- `node --check` over backend JavaScript source — passed.

No automated test, MongoDB integration test, browser end-to-end test, live email test, or deployment test was available or run.

## Phase 1 implementation update

The audit and first security-hardening pass have since made these changes:

- Production startup now rejects missing, short, and known-placeholder JWT secrets, and requires at least one explicit `CORS_ORIGINS` value.
- CORS now permits only configured browser origins (requests with no `Origin` header remain usable for command-line clients).
- JSON request bodies are limited to 100 KB.
- The frontend API base URL can be set with `VITE_API_BASE_URL`; Vite proxies `/api` to the local backend in development.
- The application and role-maintenance scripts no longer override system DNS.
- Unhandled server errors return a generic message in production without stack traces.
- ESLint now distinguishes browser source from Node backend/config files.
- A built-in Node test runner is configured with twelve authorization, validation, sender-attribution, inactive-account, support-management, assignment, status-history, and error-sanitization regression tests.
- Admins can assign/reassign/unassign support agents; the selected support access policy remains shared visibility for every active support agent.
- Ticket details show populated assignee and a chronological timeline of recorded status and assignment events. Existing records remain valid without a destructive migration.

Checks after those changes:

- `npm run build` — passed.
- `npm run lint` — passed.
- `Set-Location server; npm test` — passed, 12 tests.
- Backend `node --check` across source — passed.
- Isolated environment checks — confirmed production rejects a missing JWT secret and known placeholder, and accepts a sufficiently long secret with explicit CORS origins.
- No live MongoDB or SMTP checks were run.

## Preserve

Keep the existing login/signup and verification flows, user-owned ticket privacy, staff ticket access, message attribution, staff-only status updates, admin-only ticket deletion and agent management, and persisted knowledge-base features. Improvements should extend these contracts with regression coverage rather than replace them.

## Prioritized roadmap

1. **Baseline and security configuration:** record this audit, separate frontend/backend lint environments, require strong production secrets, restrict CORS to configured origins, configure the frontend API base URL, remove DNS overrides, bound request bodies, and prevent raw server errors from reaching production clients.
2. **Automated regression/security tests:** establish backend unit/integration coverage for auth, role enforcement, ticket ownership, replies, validation, and agent management. Add frontend tests only when they cover actual user flows. Use a test database or isolated mocks; never weaken authorization to facilitate testing.
3. **Ticket operations:** the selected policy is shared support visibility, with assignment used for accountability rather than access control. Continue with server-side pagination/filtering, status transition rules, and a separate actor-attributed audit trail with tests.
4. **Frontend refinement:** unify user, support, and admin visual language; improve ticket timeline, responsive behavior, async/error feedback, keyboard behavior, and real-data dashboards while preserving existing routes and useful UI.
5. **Notifications and self-service:** add ticket notifications through the existing email service only after provider configuration and delivery can be verified; improve knowledge-base search and suggestions against persisted articles.
6. **AI integration:** after core ticket and test stability, add backend-only AI suggestions with data minimization, response validation, timeouts/limits, graceful unavailability, and human approval for drafts.
7. **Operational/deployment preparation:** document architecture, roles, environment setup, safe fake-account handling, testing, health/readiness, Atlas network options, and production smoke tests. Do not change Atlas allowlists or deploy until explicitly requested.

## External setup not verified

- SMTP host, sender identity, credentials, and actual delivery.
- MongoDB connection and Atlas network allowlist.
- Production frontend/API origins and hosting topology.
- Any AI provider credentials or service behavior.
