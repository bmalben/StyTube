const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const { env } = require('./config/env')
const errorHandler = require('./middleware/errorHandler')
const notFound = require('./middleware/notFound')

const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
)

const allowedOrigins = env.CLIENT_URL.split(',').map((item) => item.trim())
const isLocalDevOrigin = (origin) => {
  if (!origin) return true

  try {
    const { hostname, protocol } = new URL(origin)
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname)
    return (allowedOrigins.includes(origin) || (isLocalHost && protocol === 'http:'))
  } catch {
    return false
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isLocalDevOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('CORS not allowed for this origin'))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter)
app.use('/api', generalLimiter)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'StudyTube API is running.' })
})

app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/videos', require('./routes/videoRoutes'))
app.use('/api/history', require('./routes/historyRoutes'))
app.use('/api/user', require('./routes/userRoutes'))
app.use('/api/reports', require('./routes/reportRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))

app.use(notFound)
app.use(errorHandler)

module.exports = app
