
const express = require('express')
const cors = require('cors')
const env = require('./config/env')
const connectDB = require('./config/db')
const notFound = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')
const healthRoutes = require('./routes/healthRoutes')
const ticketRoutes = require('./routes/ticketRoutes')
const articleRoutes = require('./routes/articleRoutes')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, false)
  },
}))
app.use(express.json({ limit: '100kb' }))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api', healthRoutes)
app.use('/', healthRoutes)

app.use(notFound)
app.use(errorHandler)

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`HelpDesk Pro server running at http://localhost:${env.PORT}`)
    console.log(`Environment: ${env.NODE_ENV}`)
  })
})
