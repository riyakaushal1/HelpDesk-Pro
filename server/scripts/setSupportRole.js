
require('dotenv').config()

const mongoose = require('mongoose')
const User = require('../models/User')

async function setSupportRole() {
  try {
    const email = process.argv[2]?.trim().toLowerCase()

    if (!email) {
      throw new Error(
        'Please provide the email of your existing account.'
      )
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from your .env file.')
    }

    await mongoose.connect(process.env.MONGODB_URI)

    console.log('MongoDB connected successfully.')

    const user = await User.findOne({ email })

    if (!user) {
      throw new Error(`No account found with email: ${email}`)
    }

    user.role = 'support'
    await user.save()

    console.log(`Support role assigned to: ${user.email}`)
  } catch (error) {
    console.error('Role update failed:', error.message)
    process.exitCode = 1
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  }
}

setSupportRole()
