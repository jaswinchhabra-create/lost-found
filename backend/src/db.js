const path = require('path')
const sqlite3 = require('sqlite3').verbose()

function openDb(dbPath) {
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)
  const db = new sqlite3.Database(abs)
  return db
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
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

