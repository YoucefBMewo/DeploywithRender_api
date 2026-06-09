require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
const connectionString = process.env.DATABASE_URL
app.use(cors())

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

app.get('/init', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT
      )
    `)
    res.send('Table users créée (si elle n’existait pas déjà)')
        await pool.query(`
      INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Charlie')
    `)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users')
    res.json(result.rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on https://localhost:${port}`)
  })
}

module.exports = app