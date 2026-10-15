const jwt = require('jsonwebtoken')
const env = require('../config/env')

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  )
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}

module.exports = { generateToken, verifyToken }
