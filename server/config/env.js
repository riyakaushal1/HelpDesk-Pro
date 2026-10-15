const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = NODE_ENV === 'production'
const legacyGmailConfigured = Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD,
)
const developmentJwtSecret = 'development-only-secret-do-not-use-in-production'
const jwtSecret = process.env.JWT_SECRET || (
  isProduction ? undefined : developmentJwtSecret
)
const corsOrigins = (process.env.CORS_ORIGINS || (
  isProduction ? '' : 'http://localhost:5173'
))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (
  isProduction &&
  (!jwtSecret ||
    jwtSecret.length < 32 ||
    jwtSecret === 'change-this-to-a-long-random-string' ||
    jwtSecret === developmentJwtSecret)
) {
  throw new Error('Production requires a unique JWT_SECRET with at least 32 characters.')
}

if (isProduction && corsOrigins.length === 0) {
  throw new Error('Production requires at least one allowed origin in CORS_ORIGINS.')
}

function getEnv(key, defaultValue) {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const env = {
  PORT: getEnv('PORT', '5000'),
  NODE_ENV,
  MONGODB_URI: getEnv('MONGODB_URI', 'mongodb://localhost:27017/helpdesk-pro'),
  MONGODB_DNS_SERVERS: getEnv('MONGODB_DNS_SERVERS', '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGINS: corsOrigins,
  SMTP_HOST: getEnv('SMTP_HOST', legacyGmailConfigured ? 'smtp.gmail.com' : ''),
  SMTP_PORT: getEnv('SMTP_PORT', legacyGmailConfigured ? '465' : '587'),
  SMTP_SECURE: getEnv('SMTP_SECURE', legacyGmailConfigured ? 'true' : 'false'),
  SMTP_USER: getEnv('SMTP_USER', process.env.EMAIL_USER || ''),
  SMTP_PASSWORD: getEnv('SMTP_PASSWORD', process.env.EMAIL_APP_PASSWORD || ''),
  EMAIL_FROM: getEnv('EMAIL_FROM', process.env.EMAIL_USER || ''),
  EMAIL_VERIFICATION_SECRET: getEnv('EMAIL_VERIFICATION_SECRET', ''),
}

module.exports = env
