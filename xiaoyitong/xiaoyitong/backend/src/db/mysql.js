const mysql = require('mysql2/promise')
const {
  dbHost,
  dbPort,
  dbUser,
  dbPassword,
  dbName,
  dbConnectionLimit
} = require('../config/env')

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectionLimit: dbConnectionLimit,
  waitForConnections: true,
  namedPlaceholders: true,
  charset: 'utf8mb4'
})

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

async function pingDatabase() {
  await pool.query('SELECT 1')
}

module.exports = {
  pool,
  query,
  pingDatabase
}
