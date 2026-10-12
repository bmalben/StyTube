const { connectDatabase } = require('./src/config/db')
const app = require('./src/app')
const { env } = require('./src/config/env')

const startServer = async () => {
  try {
    await connectDatabase()
    app.listen(env.PORT, () => {
      console.log(`StudyTube server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('Failed to start StudyTube server:', error.message)
    process.exit(1)
  }
}

startServer()
