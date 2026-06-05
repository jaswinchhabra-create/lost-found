const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (!m) return res.status(401).json({ error: 'Missing token' })
  const token = m[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, username: payload.username, email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

module.exports = { requireAuth, signToken }

