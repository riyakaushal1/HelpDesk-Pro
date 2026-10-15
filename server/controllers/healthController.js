function getHealth(req, res) {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}

function getRoot(req, res) {
  res.json({
    message: 'HelpDesk Pro API is running',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}

module.exports = { getHealth, getRoot }
