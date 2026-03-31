const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const { pingDatabase } = require('./db/mysql')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', async (req, res) => {
  let db = 'down'
  try {
    await pingDatabase()
    db = 'up'
  } catch (error) {
    db = 'down'
  }
  res.json({ code: 200, message: 'ok', data: { service: 'xiaoyibang-backend', db } })
})

app.use('/api', routes)
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
