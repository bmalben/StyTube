const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

const signToken = (userId) =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: '7d',
  })

const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

module.exports = { signToken, sendAuthCookie }
