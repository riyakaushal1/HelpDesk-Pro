function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.statusCode || err.status || (
    res.statusCode === 200 ? 500 : res.statusCode
  )
  const isServerError = statusCode >= 500
  const response = {
    message: isServerError
      ? 'An unexpected server error occurred.'
      : err.message || 'The request could not be completed.',
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack
  }

  return res.status(statusCode).json(response)
}

module.exports = errorHandler
