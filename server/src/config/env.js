require('dotenv').config()

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'YOUTUBE_API_KEY', 'CLIENT_URL', 'PORT']

const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL,
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
}

module.exports = { env }
