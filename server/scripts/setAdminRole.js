require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../.env'),
})

const mongoose = require('mongoose')
const User = require('../models/User')

async function setAdminRole() {
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
      throw new Error(
        `No account found with email: ${email}. Create the account first.`
      )
    }

    user.role = 'admin'
    await user.save()

    console.log(`Admin role assigned to: ${user.email}`)
  } catch (error) {
    console.error('Admin setup failed:', error.message)
    process.exitCode = 1
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  }
}

setAdminRole()
