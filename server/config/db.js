const dns = require('node:dns')
const mongoose = require('mongoose')
const env = require('./env')

mongoose.connection.on('connected', () => {
  console.log(`MongoDB connected: ${mongoose.connection.host}`)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...')
})

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.')
})

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`)
})

async function connectDB() {
  try {
    if (env.MONGODB_DNS_SERVERS.length > 0) {
      dns.setServers(env.MONGODB_DNS_SERVERS)
    }

    await mongoose.connect(env.MONGODB_URI, {
      autoSelectFamily: false,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
