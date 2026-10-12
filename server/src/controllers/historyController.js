const { z } = require('zod')
const WatchHistory = require('../models/WatchHistory')

const historyPayloadSchema = z.object({
  videoId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  thumbnail: z.string().trim().optional().or(z.literal('')),
  channelTitle: z.string().trim().optional().or(z.literal('')),
  classLevel: z.coerce.number().int().min(8).max(12).optional(),
  syllabus: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
  progressSeconds: z.coerce.number().min(0).default(0),
})

const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      WatchHistory.find({ user: req.user._id })
        .sort({ lastWatchedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchHistory.countDocuments({ user: req.user._id }),
    ])

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
}

const upsertHistory = async (req, res, next) => {
  try {
    const payload = historyPayloadSchema.parse(req.body)

    const item = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, videoId: payload.videoId },
      {
        $set: {
          ...payload,
          user: req.user._id,
          lastWatchedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    )

    return res.status(200).json({ item })
  } catch (error) {
    next(error)
  }
}

const deleteHistoryByVideoId = async (req, res, next) => {
  try {
    const { videoId } = req.params
    const result = await WatchHistory.deleteOne({ user: req.user._id, videoId })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Video not found in history.' })
    }
    return res.json({ message: 'Video removed from history.' })
  } catch (error) {
    next(error)
  }
}

const clearHistory = async (req, res, next) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id })
    return res.json({ message: 'Watch history cleared.' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getHistory, upsertHistory, deleteHistoryByVideoId, clearHistory }
