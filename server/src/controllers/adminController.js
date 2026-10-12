const { z } = require('zod')
const CuratedVideo = require('../models/CuratedVideo')
const Channel = require('../models/Channel')
const User = require('../models/User')

const videoUpdateSchema = z.object({
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
  classLevel: z.coerce.number().int().min(8).max(12).optional(),
  syllabus: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
})

const channelUpsertSchema = z.object({
  channelId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  trustTier: z.enum(['verified-adlight', 'trusted', 'general']).default('general'),
  classLevels: z.array(z.number()).optional(),
  syllabi: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  uploadsPlaylistId: z.string().trim().optional(),
  extraPlaylistIds: z.array(z.string()).optional(),
  notes: z.string().trim().optional(),
  active: z.boolean().optional(),
})

const listVideos = async (req, res, next) => {
  try {
    const videos = await CuratedVideo.find().sort({ pinned: -1, qualityScore: -1 }).limit(100).lean()
    return res.json({ videos })
  } catch (error) {
    next(error)
  }
}

const updateVideo = async (req, res, next) => {
  try {
    const payload = videoUpdateSchema.parse(req.body)
    const video = await CuratedVideo.findOneAndUpdate({ _id: req.params.id }, { $set: payload }, { new: true })
    return res.json({ video })
  } catch (error) {
    next(error)
  }
}

const listChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find().sort({ trustTier: 1, name: 1 }).lean()
    return res.json({ channels })
  } catch (error) {
    next(error)
  }
}

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 }).lean()
    return res.json({ users })
  } catch (error) {
    next(error)
  }
}

const upsertChannel = async (req, res, next) => {
  try {
    const payload = channelUpsertSchema.parse(req.body)
    const channel = await Channel.findOneAndUpdate(
      { channelId: payload.channelId },
      { $set: payload },
      { new: true, upsert: true },
    )
    return res.status(201).json({ channel })
  } catch (error) {
    next(error)
  }
}

module.exports = { listVideos, updateVideo, listChannels, listUsers, upsertChannel }
