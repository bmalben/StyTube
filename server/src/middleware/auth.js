const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { env } = require('../config/env')

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return req.cookies?.token || null
}

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const decoded = jwt.verify(token, env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-passwordHash')

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' })
  }
  return next()
}

module.exports = { protect, requireAdmin }
