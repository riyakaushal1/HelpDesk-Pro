export const ARTICLE_CATEGORIES = [
  'Getting Started',
  'Account & Access',
  'Troubleshooting',
  'Billing',
]

export const articles = [
  {
    slug: 'create-your-first-ticket',
    title: 'Create your first ticket',
    category: 'Getting Started',
    summary: 'How to describe an issue clearly so it is easier to track later.',
    body: [
      'A useful ticket starts with a short title and a complete description. Name the problem in the title, then explain what you expected, what happened, and any steps that led there.',
      'Choose a priority that reflects impact, not urgency of tone. High is for work that is blocked. Medium is for issues that slow you down. Low is for questions and small requests.',
      'This HelpDesk Pro frontend stores tickets in the browser for now. When a backend is connected, the same form can submit to an API without changing the fields.',
    ],
  },
  {
    slug: 'navigate-the-workspace',
    title: 'Navigate the workspace',
    category: 'Getting Started',
    summary: 'A short guide to Overview, My Tickets, and Knowledge Base.',
    body: [
      'Overview is a snapshot of ticket volume and recent activity. My Tickets is the full list, with search, filters, and sorting. Create Ticket is a dedicated form with validation.',
      'Use Knowledge Base for product guidance. Articles here are examples for the interface and are not connected to a live documentation CMS.',
    ],
  },
  {
    slug: 'update-your-profile-details',
    title: 'Update your profile details',
    category: 'Account & Access',
    summary: 'What the current login screens represent in this prototype.',
    body: [
      'Login and Signup are designed screens for a future authentication flow. They validate input locally and do not create real accounts.',
      'Passwords are never stored in localStorage. Until an API is connected, treat these pages as UI prototypes rather than a security system.',
    ],
  },
  {
    slug: 'workspace-access',
    title: 'Understand workspace access',
    category: 'Account & Access',
    summary: 'How this local workspace behaves before user accounts exist.',
    body: [
      'The current workspace is local to this browser. Tickets persist through refresh using localStorage, with JSON parsing safeguards if the stored data is invalid.',
      'Clearing site data will remove tickets. That is expected until tickets are stored in a database.',
    ],
  },
  {
    slug: 'ticket-not-appearing',
    title: 'A ticket is missing from the list',
    category: 'Troubleshooting',
    summary: 'Check filters, search, and browser storage before assuming data is lost.',
    body: [
      'If a ticket was just created, confirm it on Overview and My Tickets. Both pages read from the same ticket state.',
      'Search and filters can hide tickets that still exist. Use Clear filters to reset the list. If the browser blocked storage, tickets reset after refresh.',
    ],
  },
  {
    slug: 'status-not-updating',
    title: 'Status changes are not sticking',
    category: 'Troubleshooting',
    summary: 'Status updates only persist if they are saved in frontend state.',
    body: [
      'Open the ticket detail view and choose a new status. The change updates the shared ticket list immediately.',
      'There is no support team on the other side of this prototype. Status is a local field so the product can later map to a Node.js API.',
    ],
  },
  {
    slug: 'how-billing-will-work',
    title: 'How billing will work later',
    category: 'Billing',
    summary: 'This product does not process payments in the frontend.',
    body: [
      'HelpDesk Pro does not collect payment details in this version. Billing articles exist so the Knowledge Base can demonstrate category filters.',
      'When billing is added, it should live behind a dedicated API and never store card data in the browser.',
    ],
  },
  {
    slug: 'invoices-and-receipts',
    title: 'Invoices and receipts',
    category: 'Billing',
    summary: 'Where invoice history would appear after a billing backend exists.',
    body: [
      'There are no invoices in this frontend. If you need a record of usage, export is not available yet.',
      'Use this article as a placeholder for a future billing help topic, not as confirmation of a live billing system.',
    ],
  },
]
