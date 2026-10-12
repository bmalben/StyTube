const fs = require('fs')
const path = require('path')
const Channel = require('../../models/Channel')
const CuratedVideo = require('../../models/CuratedVideo')
const { computeQualityScore } = require('../qualityScore')
const { parseCuratedVideoSeed } = require('./validators')
const { isPlaceholderEntry } = require('./placeholder')
const { parseCsvRows } = require('./csv')
const { createYoutubeClient } = require('./youtubeClient')

const toSeconds = (duration = '') => {
  if (!duration || duration === 'P0D') return 0
  const match = String(duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

const normaliseFileEntries = (filePath) => {
  const absolutePath = path.resolve(filePath)
  const raw = fs.readFileSync(absolutePath, 'utf8')
  const extension = path.extname(absolutePath).toLowerCase()

  if (extension === '.json') {
    const payload = JSON.parse(raw)
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.videos)) return payload.videos
    if (Array.isArray(payload.curatedVideos)) return payload.curatedVideos
    return []
  }

  if (extension === '.csv') {
    return parseCsvRows(raw)
  }

  throw new Error('Unsupported video seed format. Use JSON or CSV.')
}

const ensureChannelExists = async ({ channelId, name, trustTier = 'general' }) => {
  if (!channelId) return null

  const existing = await Channel.findOne({ channelId }).lean()
  if (existing) return existing

  const fallback = {
    channelId,
    name: name || 'Needs review',
    trustTier,
    classLevels: [],
    syllabi: [],
    subjects: [],
    languages: [],
    uploadsPlaylistId: '',
    extraPlaylistIds: [],
    notes: 'Created from manual curated video import; review required.',
    active: false,
  }

  await Channel.updateOne({ channelId }, { $set: fallback }, { upsert: true })
  return fallback
}

const seedCuratedVideos = async ({
  filePath,
  dryRun = false,
  only = '',
  prune = false,
  youtubeClient = createYoutubeClient(),
}) => {
  const summary = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    rejected: [],
    skippedPlaceholder: 0,
    quotaUnitsUsed: 0,
    pruneCandidates: [],
  }

  const entries = normaliseFileEntries(filePath)
  const inScope = entries.filter((entry) => {
    if (!only) return true
    return String(entry.videoId || '').trim().toLowerCase() === String(only).trim().toLowerCase()
  })

  const validEntries = []
  for (const entry of inScope) {
    if (isPlaceholderEntry(entry)) {
      summary.skippedPlaceholder += 1
      continue
    }

    try {
      const parsed = parseCuratedVideoSeed(entry)
      validEntries.push(parsed)
    } catch (error) {
      summary.rejected.push({ videoId: entry.videoId || 'unknown', reason: error.message })
    }
  }

  const uniqueById = new Map()
  for (const entry of validEntries) {
    if (!uniqueById.has(entry.videoId)) uniqueById.set(entry.videoId, entry)
  }

  const ids = [...uniqueById.keys()]
  const detailsMap = new Map()

  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50)
    const videos = await youtubeClient.fetchVideosByIds(batch)
    summary.quotaUnitsUsed += 1

    for (const item of videos) {
      detailsMap.set(item.id, item)
    }
  }

  for (const entry of uniqueById.values()) {
    try {
      const item = detailsMap.get(entry.videoId)
      if (!item) {
        throw new Error('video not found in YouTube')
      }

      const snippet = item.snippet || {}
      const status = item.status || {}
      const statistics = item.statistics || {}
      const contentDetails = item.contentDetails || {}
      const durationSeconds = toSeconds(contentDetails.duration)

      if (status.privacyStatus !== 'public') {
        throw new Error('video is not public')
      }
      if (status.embeddable === false) {
        throw new Error('video is not embeddable')
      }
      if (snippet.liveBroadcastContent && snippet.liveBroadcastContent !== 'none') {
        throw new Error('video is live or upcoming')
      }
      if (durationSeconds < 180 || durationSeconds > 5400) {
        throw new Error(`duration ${durationSeconds}s outside 3-90 minute range`)
      }

      const channelId = entry.channelId || snippet.channelId
      if (!channelId) {
        throw new Error('channelId missing')
      }

      const channel = await ensureChannelExists({
        channelId,
        name: snippet.channelTitle,
        trustTier: 'general',
      })

      const existing = await CuratedVideo.findOne({ videoId: entry.videoId }).lean()
      const resolvedTrustTier = channel?.trustTier || 'general'
      const title = snippet.title || 'Untitled video'
      const likeCount = statistics.likeCount === undefined || statistics.likeCount === null ? null : Number(statistics.likeCount || 0)
      const qualityScore = computeQualityScore({
        likeCount: Number(likeCount || 0),
        viewCount: Number(statistics.viewCount || 0),
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        title,
        trustTier: resolvedTrustTier,
      })

      const nextPayload = {
        videoId: entry.videoId,
        channelId,
        title,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        durationSeconds,
        viewCount: Number(statistics.viewCount || 0),
        likeCount: likeCount === null ? null : Number(likeCount),
        publishedAt: snippet.publishedAt || new Date(),
        classLevel: entry.classLevel,
        syllabus: entry.syllabus,
        subject: entry.subject,
        language: entry.language,
        chapter: entry.chapter,
        qualityScore,
        trustTier: resolvedTrustTier,
        pinned: Object.prototype.hasOwnProperty.call(entry, 'pinned') ? Boolean(entry.pinned) : existing?.pinned ?? false,
        hidden: existing?.hidden ?? false,
        source: existing?.source || 'manual',
        lastRefreshedAt: new Date(),
      }

      if (existing && existing.hidden) {
        nextPayload.hidden = true
      }

      if (!dryRun) {
        const result = await CuratedVideo.updateOne({ videoId: entry.videoId }, { $set: nextPayload }, { upsert: true })
        if (!existing) summary.inserted += 1
        else if (result.modifiedCount > 0 || result.upsertedCount > 0) summary.updated += 1
        else summary.unchanged += 1
      } else if (!existing) {
        summary.inserted += 1
      } else {
        summary.unchanged += 1
      }
    } catch (error) {
      summary.rejected.push({ videoId: entry.videoId, reason: error.message })
    }
  }

  if (prune && !dryRun) {
    const allManual = await CuratedVideo.find({ source: 'manual' }).select('videoId').lean()
    const manualIds = new Set(allManual.map((video) => video.videoId))
    const seedIds = new Set(uniqueById.keys())
    summary.pruneCandidates = [...manualIds].filter((videoId) => !seedIds.has(videoId))
  }

  return summary
}

module.exports = {
  seedCuratedVideos,
  normaliseFileEntries,
}
