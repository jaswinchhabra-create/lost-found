const express = require('express')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { getAsync, runAsync } = require('../db')
const { signToken } = require('../auth')

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const db = req.app.locals.db
    const { username, email, password } = req.body || {}
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, password required' })
    }

    const existing = await getAsync(db, `SELECT id FROM users WHERE username = ? OR email = ?`, [username, email])
    if (existing) return res.status(409).json({ error: 'Username or email already exists' })

    const password_hash = await bcrypt.hash(password, 10)
    const id = uuidv4()

    await runAsync(
      db,
      `INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, username, email, password_hash, Date.now()]
    )

    const user = { id, username, email }
    const token = signToken(user)
    return res.json({ token, user })
  } catch (_e) {
    return res.status(500).json({ error: 'Register failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const db = req.app.locals.db

    // support either {usernameOrEmail} OR {username,email}
    const { usernameOrEmail, username, email, password } = req.body || {}
    const identifier = usernameOrEmail || username || email

    if (!identifier || !password) return res.status(400).json({ error: 'username/email and password required' })

    const user = await getAsync(db, `SELECT * FROM users WHERE username = ? OR email = ?`, [identifier, identifier])
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user)
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (_e) {
    return res.status(500).json({ error: 'Login failed' })
  }
})

module.exports = router

