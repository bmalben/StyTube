const { z } = require('zod')
const axios = require('axios')
const CuratedVideo = require('../models/CuratedVideo')
const Channel = require('../models/Channel')
const User = require('../models/User')
const { env } = require('../config/env')
const { buildAvatarUrl } = require('../utils/avatar')

const videoUpdateSchema = z.object({
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
  classLevel: z.coerce.number().int().min(8).max(12).optional(),
  syllabus: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
  chapter: z.string().trim().optional(),
  title: z.string().trim().min(1).optional(),
})

const channelUpsertSchema = z.object({
  channelId: z.string().trim().min(1).optional(),
  handle: z.string().trim().optional(),
  name: z.string().trim().min(1),
  trustTier: z.enum(['verified-adlight', 'trusted', 'general']).default('general'),
  classLevels: z.array(z.number().int().min(8).max(12)).default([]),
  syllabi: z.array(z.string()).default([]),
  subjects: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  uploadsPlaylistId: z.string().trim().optional(),
  extraPlaylistIds: z.array(z.string()).default([]),
  notes: z.string().trim().optional(),
  active: z.boolean().default(true),
}).refine((value) => Boolean(value.channelId || value.handle), {
  message: 'A channelId or handle is required.',
  path: ['channelId'],
})

const videoCreateSchema = z.object({
  videoId: z.string().trim().min(1),
  classLevel: z.coerce.number().int().min(8).max(12).default(10),
  syllabus: z.string().trim().default('CBSE'),
  subject: z.string().trim().default('Physics'),
  language: z.string().trim().default('English'),
  chapter: z.string().trim().default(''),
  pinned: z.boolean().default(false),
  hidden: z.boolean().default(false),
  source: z.enum(['manual', 'ingestion']).default('manual'),
})

const parseDurationSeconds = (duration = '') => {
  const match = String(duration).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
}

const listVideos = async (req, res, next) => {
  try {
    const videos = await CuratedVideo.find().sort({ pinned: -1, qualityScore: -1 }).limit(200).lean()
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

const createVideo = async (req, res, next) => {
  try {
    const payload = videoCreateSchema.parse(req.body)
    let youtubeResponse

    try {
      youtubeResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics,status',
          id: payload.videoId,
          key: env.YOUTUBE_API_KEY,
        },
      })
      console.log('[admin/videos] videos.list status:', youtubeResponse.status)
    } catch (youtubeError) {
      console.log('[admin/videos] videos.list status:', youtubeError.response?.status || 'no response')
      const error = new Error('Unable to fetch video metadata from YouTube.')
      error.statusCode = 502
      error.code = 'YOUTUBE_API_FAILED'
      throw error
    }

    const item = youtubeResponse.data.items?.[0]
    if (!item?.snippet?.title || !item.snippet.channelId || !item.snippet.channelTitle) {
      const error = new Error('Video metadata was not found on YouTube.')
      error.statusCode = 404
      error.code = 'YOUTUBE_VIDEO_NOT_FOUND'
      throw error
    }

    const existing = await CuratedVideo.findOne({ videoId: payload.videoId }).lean()
    const maybeChannel = await Channel.findOne({ channelId: item.snippet.channelId }).lean()
    const snippet = item.snippet
    const statistics = item.statistics || {}
    const normalizedVideo = {
      videoId: payload.videoId,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      title: snippet.title,
      thumbnail: snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${payload.videoId}/hqdefault.jpg`,
      durationSeconds: parseDurationSeconds(item.contentDetails?.duration),
      viewCount: Number(statistics.viewCount || 0),
      likeCount: Number(statistics.likeCount || 0),
      publishedAt: snippet.publishedAt || new Date(),
      classLevel: payload.classLevel,
      syllabus: payload.syllabus,
      subject: payload.subject,
      language: payload.language,
      chapter: payload.chapter,
      pinned: payload.pinned,
      hidden: payload.hidden,
      source: existing?.source || payload.source || 'manual',
      qualityScore: existing?.qualityScore || 0,
      trustTier: maybeChannel?.trustTier || 'general',
      lastRefreshedAt: new Date(),
    }
    console.log('[admin/videos] normalized video before save:', normalizedVideo)

    if (existing) {
      const updated = await CuratedVideo.findOneAndUpdate(
        { videoId: payload.videoId },
        { $set: normalizedVideo },
        { new: true },
      )
      return res.status(200).json({ video: updated, duplicate: true })
    }

    const video = await CuratedVideo.create(normalizedVideo)

    return res.status(201).json({ video })
  } catch (error) {
    next(error)
  }
}

const deleteVideo = async (req, res, next) => {
  try {
    const video = await CuratedVideo.findById(req.params.id)
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' })
    }

    if (video.source === 'ingestion') {
      video.hidden = true
      await video.save()
      return res.json({ message: 'Ingestion video hidden instead of deleted.', video })
    }

    await CuratedVideo.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Video deleted.', deleted: true })
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
    const users = await User.find({ role: 'user' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ users })
  } catch (error) {
    next(error)
  }
}

const upsertChannel = async (req, res, next) => {
  try {
    const payload = channelUpsertSchema.parse(req.body)
    const filter = payload.channelId ? { channelId: payload.channelId } : { handle: payload.handle }

    const channel = await Channel.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    return res.status(201).json({ channel })
  } catch (error) {
    next(error)
  }
}

const deleteChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id)
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' })
    }

    const videosCount = await CuratedVideo.countDocuments({ channelId: channel.channelId })
    if (req.query.hard === 'true') {
      if (videosCount > 0) {
        return res.status(409).json({ message: `Cannot delete channel while it still has ${videosCount} videos.` })
      }
      await Channel.findByIdAndDelete(req.params.id)
      return res.json({ message: 'Channel deleted.' })
    }

    channel.active = false
    await channel.save()
    return res.json({ message: 'Channel deactivated.', channel })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listVideos,
  updateVideo,
  createVideo,
  deleteVideo,
  listChannels,
  listUsers,
  upsertChannel,
  deleteChannel,
}
