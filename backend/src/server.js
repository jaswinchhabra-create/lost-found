require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const { openDb, initDb } = require('./db')
const authRoutes = require('./routes/auth')
const postsRoutes = require('./routes/posts')

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(express.json({ limit: '1mb' }))

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: false }))

const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })
app.use('/uploads', express.static(uploadDir))

const dbPath = process.env.DB_PATH || 'lostfound.db'
const db = openDb(dbPath)
app.locals.db = db

initDb(db)
  .then(() => {
    console.log('DB ready')
  })
  .catch((e) => {
    console.error('DB init failed', e)
    process.exit(1)
  })

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)

// Serve frontend (single-deployment mode)
// When deploying, build the frontend to: frontend/dist
// Serve repo root relative to current working directory.
const repoRoot = path.resolve(process.cwd(), '..');
const distDir = path.join(repoRoot, 'frontend', 'dist');




if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  // SPA fallback: Vite app routes should all return index.html
  app.get('*', (req, res, next) => {
    // Let API routes and uploads fall through to their handlers
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  console.warn(`Frontend dist not found at: ${distDir}. Backend will serve only the API.`);
}

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Lost & Found backend running on http://localhost:${port}`)
})


