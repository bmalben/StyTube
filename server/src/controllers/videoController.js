const { z } = require('zod')
const CuratedVideo = require('../models/CuratedVideo')
const { searchVideos, getVideoDetails } = require('../services/youtubeService')
const { resolveFallbackMatches } = require('../services/fallbackLadder')

const videoQuerySchema = z.object({
  classLevel: z.coerce.number().int().min(8).max(12).optional(),
  syllabus: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
  q: z.string().trim().optional(),
  pageToken: z.string().trim().optional(),
})

const badgeForTier = (trustTier = 'general') => {
  if (trustTier === 'verified-adlight') return 'verified-adlight'
  if (trustTier === 'trusted') return 'trusted'
  return 'general'
}

const formatDuration = (seconds = 0) => {
  if (!seconds) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const exactValueMatch = (value, fallback = '') => {
  const normalized = String(value ?? fallback).trim()
  if (!normalized) return undefined
  const pattern = new RegExp(`^${escapeRegex(normalized)}$`, 'i')
  return { $regex: pattern }
}

const isAnySelection = (value = '') => String(value || '').trim().toLowerCase() === 'any'

const mapCuratedVideo = (video, fallbackLevel = 'exact') => ({
  id: video.videoId,
  title: video.title,
  description: video.description || '',
  channelTitle: video.channelTitle || 'StudyTube',
  thumbnail: video.thumbnail,
  duration: formatDuration(video.durationSeconds || 0),
  views: Number(video.viewCount || 0).toLocaleString(),
  publishedAt: video.publishedAt || new Date().toISOString(),
  classLevel: Number(video.classLevel || 0),
  syllabus: video.syllabus || 'CBSE',
  subject: video.subject || 'Physics',
  language: video.language || 'English',
  chapter: video.chapter || 'General',
  qualityScore: Number(video.qualityScore || 0),
  pinned: Boolean(video.pinned),
  hidden: Boolean(video.hidden),
  badge: badgeForTier(video.trustTier),
  badgeLabel:
    video.trustTier === 'verified-adlight'
      ? 'Verified ad-light channel'
      : video.trustTier === 'trusted'
        ? 'Trusted educator'
        : 'General source',
  fallbackLevel,
})

const getVideos = async (req, res, next) => {
  try {
    const payload = videoQuerySchema.parse(req.query)
    const classLevel = Number(payload.classLevel || 10)
    const syllabus = String(payload.syllabus || 'CBSE').trim()
    const subject = String(payload.subject || 'Physics').trim()
    const language = String(payload.language || 'Any').trim()

    const exactFilter = {
      classLevel,
      hidden: { $ne: true },
    }
    const syllabusMatcher = exactValueMatch(syllabus, 'CBSE')
    const subjectMatcher = exactValueMatch(subject, 'Physics')
    if (syllabusMatcher) exactFilter.syllabus = syllabusMatcher
    if (subjectMatcher) exactFilter.subject = subjectMatcher
    if (!isAnySelection(language)) exactFilter.language = exactValueMatch(language, 'English')

    const exact = await CuratedVideo.find(exactFilter)
      .sort({ pinned: -1, qualityScore: -1, lastRefreshedAt: -1 })
      .lean()

    const anyLanguageFilter = {
      classLevel,
      hidden: { $ne: true },
    }
    if (syllabusMatcher) anyLanguageFilter.syllabus = syllabusMatcher
    if (subjectMatcher) anyLanguageFilter.subject = subjectMatcher
    if (!isAnySelection(language)) anyLanguageFilter.language = { $not: exactValueMatch(language, 'English') }

    const anyLanguage = await CuratedVideo.find(anyLanguageFilter)
      .sort({ pinned: -1, qualityScore: -1, lastRefreshedAt: -1 })
      .lean()

    const otherSyllabusFilter = {
      classLevel,
      hidden: { $ne: true },
      subject: subjectMatcher,
      syllabus: { $not: syllabusMatcher },
    }

    const otherSyllabus = await CuratedVideo.find(otherSyllabusFilter)
      .sort({ pinned: -1, qualityScore: -1, lastRefreshedAt: -1 })
      .limit(20)
      .lean()

    let youtubeFallback = []
    if (exact.length < 5 || anyLanguage.length > 0 || otherSyllabus.length > 0) {
      const searchResponse = await searchVideos({
        classLevel,
        syllabus,
        subject,
        language,
        q: payload.q,
      })
      youtubeFallback = (searchResponse.items || []).slice(0, 8).map((item) => ({
        ...item,
        videoId: item.id,
        trustTier: 'general',
        qualityScore: 65,
        title: item.title,
        thumbnail: item.thumbnail,
        durationSeconds: item.duration ? item.duration.split(':').reduce((acc, part) => acc * 60 + Number(part), 0) : 0,
        viewCount: Number(String(item.views || '0').replace(/[^\d]/g, '')) || 0,
        publishedAt: item.publishedAt || new Date().toISOString(),
        description: item.description || '',
      }))
    }

    const fallbackResult = resolveFallbackMatches({
      exact: exact.map((item) => mapCuratedVideo(item, 'exact')),
      anyLanguage: anyLanguage.map((item) => mapCuratedVideo(item, 'language')),
      otherSyllabus: otherSyllabus.map((item) => mapCuratedVideo(item, 'syllabus')),
      youtubeFallback: youtubeFallback.map((item) => mapCuratedVideo(item, 'search')),
      language,
    })

    const items = fallbackResult.items.slice(0, 12)

    return res.json({
      items,
      nextPageToken: null,
      totalResults: items.length,
      fallbackLevel: fallbackResult.fallbackLevel,
      note: fallbackResult.note,
      query: {
        classLevel,
        syllabus,
        subject,
        language,
      },
    })
  } catch (error) {
    next(error)
  }
}

const getVideoById = async (req, res, next) => {
  try {
    const video = await getVideoDetails(req.params.videoId)
    return res.json({ video })
  } catch (error) {
    next(error)
  }
}

module.exports = { getVideos, getVideoById }
