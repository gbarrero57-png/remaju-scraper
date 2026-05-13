require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const { DatabaseSync } = require('node:sqlite')
const fs   = require('fs')
const path = require('path')

const DB_PATH     = process.env.DB_PATH || path.join(__dirname, '../../../data/remaju.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

function initDb () {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db     = new DatabaseSync(DB_PATH)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')

  // node:sqlite ejecuta multi-statement vía exec separados por ;
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    try { db.exec(stmt + ';') } catch (_) {}
  }

  console.log(`✅ Base de datos lista: ${DB_PATH}`)
  db.close()
}

function getDb () {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;')
  return db
}

if (require.main === module) initDb()

module.exports = { initDb, getDb, DB_PATH }
