const normalizeBaseUrl = (value = '') => String(value || '').replace(/\/+$/, '')

const buildAvatarUrl = (photoId, req = null) => {
  if (!photoId) return null

  const baseUrl = normalizeBaseUrl(process.env.PUBLIC_API_URL) || (() => {
    if (!req) return 'http://localhost:5000'

    const forwardedProto = req.headers?.['x-forwarded-proto'] || req.protocol || 'http'
    const forwardedHost = req.headers?.['x-forwarded-host'] || req.get?.('host') || 'localhost:5000'
    return `${forwardedProto}://${forwardedHost}`
  })()

  return `${baseUrl}/api/photos/${photoId}`
}

const serializeUser = (user, req = null) => {
  const raw = user?.toObject ? user.toObject() : { ...user }

  if (raw.passwordHash) {
    delete raw.passwordHash
  }

  const avatar = raw.avatar || {}
  raw.avatar = {
    photoId: avatar.photoId || null,
    updatedAt: avatar.updatedAt || null,
  }
  raw.avatarUrl = raw.avatar.photoId ? buildAvatarUrl(raw.avatar.photoId, req) : null

  return raw
}

module.exports = { buildAvatarUrl, serializeUser }
