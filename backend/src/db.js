const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

// ---- sql.js (WASM, no native binaries) ----
// We load the database file into memory, then keep it in process.
// This is enough for typical Render usage; persistence depends on writes being flushed.

async function openDb(dbPath) {
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)

  const SQL = await initSqlJs({ locateFile: (file) => `node_modules/sql.js/dist/${file}` })

  let fileBuffer = null
  if (fs.existsSync(abs)) {
    fileBuffer = fs.readFileSync(abs)
  }

  const db = new SQL.Database(fileBuffer || undefined)
  db.__dbFilePath = abs
  return db
}

function flushDb(db) {
  try {
    if (!db || !db.__dbFilePath) return
    const data = Buffer.from(db.export())
    fs.writeFileSync(db.__dbFilePath, data)
  } catch (_e) {
    // ignore persistence issues; app should still function in-memory
  }
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      while (stmt.step()) {
        // ignore rows
      }
      stmt.free()
      flushDb(db)
      resolve({ lastID: undefined, changes: undefined })
    } catch (e) {
      reject(e)
    }
  })
}

function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.free()
      resolve(rows)
    } catch (e) {
      reject(e)
    }
  })
}

function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const row = stmt.step() ? stmt.getAsObject() : null
      stmt.free()
      resolve(row)
    } catch (e) {
      reject(e)
    }
  })
}



async function initDb(db) {
  await runAsync(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`
  )

  await runAsync(
    db,
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lost','found')),
      tag TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  )

  await runAsync(
    db,
    `CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      url_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )`
  )
}

module.exports = { openDb, initDb, runAsync, allAsync, getAsync }




