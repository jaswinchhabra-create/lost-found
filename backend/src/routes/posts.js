const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { requireAuth } = require('../auth')
const { runAsync, allAsync, getAsync } = require('../db')

const router = express.Router()

const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir)
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname || '') || ''
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '')
    cb(null, `${uuidv4()}${safeExt}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'))
    cb(null, true)
  }
})

router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db
    const posts = await allAsync(
      db,
      `SELECT p.*, u.username, u.email
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 50`
    )

    // attach images
    const postIds = posts.map((p) => p.id)
    if (postIds.length === 0) return res.json({ posts: [] })

    const placeholders = postIds.map(() => '?').join(',')
    const images = await allAsync(
      db,
      `SELECT * FROM images WHERE post_id IN (${placeholders}) ORDER BY created_at ASC`,
      postIds
    )

    const byPost = new Map()
    for (const img of images) {
      if (!byPost.has(img.post_id)) byPost.set(img.post_id, [])
      byPost.get(img.post_id).push({ id: img.id, url: img.url_path })
    }

    const out = posts.map((p) => ({
      id: p.id,
      type: p.type,
      tag: p.tag,
      title: p.title,
      description: p.description,
      createdAt: p.created_at,
      user: { id: p.user_id, username: p.username, email: p.email },
      images: byPost.get(p.id) || []
    }))

    return res.json({ posts: out })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load posts' })
  }
})

router.post('/', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const db = req.app.locals.db
    const { type, tag, title, description } = req.body || {}

    if (!type || !title || !description) return res.status(400).json({ error: 'type, title, description required' })
    if (!['lost', 'found'].includes(type)) return res.status(400).json({ error: 'type must be lost or found' })

    const images = req.files || []
    if (!images.length) return res.status(400).json({ error: 'At least one image is required' })

    const postId = uuidv4()
    await runAsync(
      db,
      `INSERT INTO posts (id, user_id, type, tag, title, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [postId, req.user.id, type, tag || null, title, description, Date.now()]
    )

    for (const file of images) {
      const id = uuidv4()
      const url_path = `/uploads/${file.filename}`
      await runAsync(
        db,
        `INSERT INTO images (id, post_id, filename, url_path, created_at) VALUES (?, ?, ?, ?, ?)`,
        [id, postId, file.filename, url_path, Date.now()]
      )
    }

    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Create post failed' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = req.app.locals.db
    const post = await getAsync(db, `SELECT * FROM posts WHERE id = ?`, [req.params.id])
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await runAsync(db, `DELETE FROM posts WHERE id = ?`, [req.params.id])
    await runAsync(db, `DELETE FROM images WHERE post_id = ?`, [req.params.id])

    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Delete failed' })
  }
})

module.exports = router

