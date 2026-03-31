const app = require('./app')
const { port } = require('./config/env')
const { pingDatabase } = require('./db/mysql')

async function bootstrap() {
  try {
    await pingDatabase()
    console.log('MySQL connected')
  } catch (error) {
    console.error('MySQL connection failed:', error.message)
  }

  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`)
  })
}

bootstrap()
