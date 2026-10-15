# HelpDesk Pro — Full-Stack MERN Helpdesk System

**A Full-Stack Web Application for Customer Support and Ticket Management**

HelpDesk Pro is a web-based helpdesk management system built with the MERN stack. It aims to simplify customer support by organizing support tickets, user accounts, and knowledge-base articles in one platform.

## Tech Stack

- **Frontend:** React.js, JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Build Tool:** Vite

## Features

- User registration and login
- Support ticket creation and management
- Ticket status and priority tracking
- Knowledge base and support articles
- Admin dashboard
- Email verification and password reset flows

*Features should be considered complete only after they have been tested in the running application.*

## Project Structure

```text
HelpDesk-Pro/
├── src/              # React frontend
├── public/           # Static assets
├── server/           # Node.js and Express backend
│   ├── config/       # Configuration and database setup
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Authentication and validation
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   └── services/     # Backend services
├── package.json
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/riyakaushal1/HelpDesk-Pro.git
cd HelpDesk-Pro
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server/` directory using `server/.env.example` as a reference. Configure your MongoDB connection string, JWT secret, and other required environment variables locally.

**Never commit real credentials or secret keys to GitHub.**

### 5. Run the application

Start the backend and frontend using the scripts defined in their respective `package.json` files. Configure the required environment variables before starting the server.

## Project Status

This project is under development. Setup instructions, integrations, and features may change as development progresses.

## Author

**Riya Kaushal**

GitHub: [@riyakaushal1](https://github.com/riyakaushal1)
