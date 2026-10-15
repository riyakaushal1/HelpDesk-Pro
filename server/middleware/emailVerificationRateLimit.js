const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 20
const MAX_BUCKETS = 10000
const buckets = new Map()

function cleanExpired(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

const cleanupTimer = setInterval(() => cleanExpired(Date.now()), WINDOW_MS)
cleanupTimer.unref()

function emailVerificationRateLimit(req, res, next) {
  const now = Date.now()
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  let bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) cleanExpired(now)
    if (buckets.size >= MAX_BUCKETS) {
      return res.status(429).json({
        message: 'Too many verification requests. Please try again later.',
      })
    }
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(key, bucket)
  }

  bucket.count += 1
  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many verification requests. Please try again later.',
    })
  }

  return next()
}

module.exports = emailVerificationRateLimit
