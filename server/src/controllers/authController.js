const bcrypt = require('bcryptjs')
const { z } = require('zod')
const User = require('../models/User')
const { sendAuthCookie, signToken } = require('../utils/auth')

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
})

const sanitizeUser = (user) => user.toPublicJSON ? user.toPublicJSON() : { ...user.toObject(), passwordHash: undefined }

const register = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body)

    const existingUser = await User.findOne({ email: payload.email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    const passwordHash = await bcrypt.hash(payload.password, 12)
    const user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
    })

    const token = signToken(user._id.toString())
    sendAuthCookie(res, token)

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body)
    const user = await User.findOne({ email: payload.email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const matches = await bcrypt.compare(payload.password, user.passwordHash)
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken(user._id.toString())
    sendAuthCookie(res, token)

    return res.json({
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
}

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res.json({ message: 'Logged out successfully.' })
}

const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const user = await User.findById(req.user._id).select('-passwordHash')
    return res.json({ user: sanitizeUser(user) })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, logout, getMe }
