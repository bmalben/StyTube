const express = require('express')
const rateLimit = require('express-rate-limit')
const multer = require('multer')
const { fileTypeFromBuffer } = require('file-type')
const sharp = require('sharp')
const crypto = require('crypto')
const { protect, requireAuth, requireStudyTubeHeader } = require('../middleware/auth')
const ProfilePhoto = require('../models/ProfilePhoto')
const User = require('../models/User')
const { buildAvatarUrl } = require('../utils/avatar')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
})

const photoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many photo uploads. Please try again later.' } },
})

const isPhotoAllowed = (detectedType) => ['image/jpeg', 'image/png', 'image/webp'].includes(detectedType)

const processPhoto = async (buffer) => {
  const detected = await fileTypeFromBuffer(buffer)
  if (!detected || !isPhotoAllowed(detected.mime)) {
    const error = new Error('Only JPEG, PNG, and WebP images are allowed.')
    error.statusCode = 415
    error.code = 'UNSUPPORTED_IMAGE_TYPE'
    throw error
  }

  const image = sharp(buffer)
  const metadata = await image.metadata()
  if (metadata.width && metadata.height && Math.max(metadata.width, metadata.height) > 4000) {
    const error = new Error('Image is too large. Max dimensions are 4000 x 4000 pixels.')
    error.statusCode = 413
    error.code = 'IMAGE_TOO_LARGE'
    throw error
  }

  const processed = await image
    .rotate()
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .webp({ quality: 80, effort: 6 })
    .withMetadata({})
    .toBuffer()

  const finalMeta = await sharp(processed).metadata()

  return {
    data: processed,
    size: processed.length,
    width: finalMeta.width || 256,
    height: finalMeta.height || 256,
  }
}

const setUserAvatar = async (userId, photoRecord) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found.')
  }

  user.avatar = {
    photoId: photoRecord.photoId,
    updatedAt: new Date(),
  }
  await user.save()
}

router.put('/photo', photoLimiter, requireAuth, requireStudyTubeHeader, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'NO_FILE', message: 'Please choose an image file to upload.' },
      })
    }

    const detected = await fileTypeFromBuffer(req.file.buffer)
    if (!detected || !isPhotoAllowed(detected.mime)) {
      return res.status(415).json({
        error: { code: 'UNSUPPORTED_IMAGE_TYPE', message: 'Only JPEG, PNG, and WebP images are allowed.' },
      })
    }

    const processed = await processPhoto(req.file.buffer)
    const photoId = crypto.randomBytes(12).toString('hex')

    const existing = await ProfilePhoto.findOne({ user: req.user._id })
    if (existing) {
      await ProfilePhoto.findByIdAndDelete(existing._id)
    }

    const created = await ProfilePhoto.create({
      user: req.user._id,
      photoId,
      contentType: 'image/webp',
      data: processed.data,
      size: processed.size,
      width: processed.width,
      height: processed.height,
    })

    await setUserAvatar(req.user._id, created)

    return res.json({
      avatarUrl: buildAvatarUrl(photoId, req),
    })
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: { code: 'UPLOAD_ERROR', message: error.message },
      })
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: { code: error.code || 'UPLOAD_FAILED', message: error.message },
      })
    }

    return next(error)
  }
})

router.delete('/photo', photoLimiter, requireAuth, requireStudyTubeHeader, async (req, res, next) => {
  try {
    const existing = await ProfilePhoto.findOne({ user: req.user._id })
    if (existing) {
      await ProfilePhoto.deleteOne({ _id: existing._id })
    }

    const user = await User.findById(req.user._id)
    if (user) {
      user.avatar = { photoId: null, updatedAt: null }
      await user.save()
    }

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/:photoId', async (req, res, next) => {
  try {
    const { photoId } = req.params
    if (!/^[a-f0-9]{24}$/.test(photoId)) {
      return res.status(404).json({ error: { code: 'PHOTO_NOT_FOUND', message: 'Photo not found.' } })
    }

    const photo = await ProfilePhoto.findOne({ photoId }).exec()
    if (!photo) {
      return res.status(404).json({ error: { code: 'PHOTO_NOT_FOUND', message: 'Photo not found.' } })
    }

    const rawData = photo.data
    const buffer = Buffer.isBuffer(rawData)
      ? rawData
      : Buffer.isBuffer(rawData?.buffer)
        ? Buffer.from(rawData.buffer, rawData.offset || 0, rawData.length || rawData.buffer.byteLength)
        : Buffer.from(rawData || [])

    const etag = `"${photo._id.toString()}-${photo.updatedAt?.getTime?.() || 0}"`
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    })

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end()
    }

    return res.end(buffer)
  } catch (error) {
    return next(error)
  }
})

module.exports = router
