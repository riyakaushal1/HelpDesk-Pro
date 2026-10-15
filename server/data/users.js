let users = []

function getAll() {
  return users.map(({ password, ...rest }) => rest)
}

function findByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

function findById(id) {
  return users.find((user) => user.id === id)
}

function create({ name, email, password, role }) {
  const user = {
    id: `U-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: role || 'user',
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  const { password: _, ...safeUser } = user
  return safeUser
}

module.exports = { getAll, findByEmail, findById, create }
