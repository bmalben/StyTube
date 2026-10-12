const axios = require('axios')
const { env } = require('../config/env')
const mockVideos = require('../data/mockVideos')

const videoCache = new Map()

const fallbackVideos = (queryOptions = {}) => {
  const { classLevel, syllabus, subject, language, q } = queryOptions
  const normalizedClass = Number(classLevel) || 10
  const normalizedSyllabus = String(syllabus || 'CBSE')
  const normalizedSubject = String(subject || 'Physics')
  const normalizedLanguage = String(language || 'Any').trim()
  const normalizedQuery = String(q || '').trim().toLowerCase()

  return mockVideos.filter((item) => {
    const matchesClass = Number(item.classLevel) === normalizedClass
    const matchesBoard = String(item.syllabus || 'CBSE').toLowerCase() === normalizedSyllabus.toLowerCase()
    const itemSubject = String(item.subject || 'Physics').toLowerCase()
    const matchesSubject =
      itemSubject === normalizedSubject.toLowerCase() ||
      (normalizedSubject.toLowerCase() === 'science' && ['physics', 'chemistry', 'biology'].includes(itemSubject))
    const matchesLanguage =
      normalizedLanguage.toLowerCase() === 'any' ||
      String(item.language || 'Any').toLowerCase() === normalizedLanguage.toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.chapter.toLowerCase().includes(normalizedQuery) ||
      item.subject.toLowerCase().includes(normalizedQuery)

    return matchesClass && matchesBoard && matchesSubject && matchesLanguage && matchesQuery
  })
}

const normalizeLanguage = (language = 'Any') => {
  const value = String(language || 'Any').trim()
  if (!value || value.toLowerCase() === 'any') return null
  return value.toLowerCase()
}

const languageCodeMap = {
  english: 'en',
  malayalam: 'ml',
  hindi: 'hi',
  tamil: 'ta',
  kannada: 'kn',
  telugu: 'te',
}

const parseDuration = (duration) => {
  if (!duration) return '0:00'

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)

  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60

  if (hh > 0) return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${mm}:${String(ss).padStart(2, '0')}`
}

const normalizeVideo = (item, subject, classLevel, syllabus, language) => {
  const contentDetails = item.contentDetails || {}
  const statistics = item.statistics || {}
  const snippet = item.snippet || {}

  return {
    id: item.id,
    title: snippet.title || 'Untitled video',
    description: snippet.description || '',
    channelTitle: snippet.channelTitle || 'Unknown channel',
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    duration: parseDuration(contentDetails.duration),
    views: statistics.viewCount ? Number(statistics.viewCount).toLocaleString() : '0',
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    classLevel: classLevel || null,
    syllabus: syllabus || null,
    subject: subject || null,
    language: language || 'Any',
    chapter: snippet.tags?.[0] || 'General',
  }
}

const searchVideos = async ({ classLevel, syllabus, subject, language = 'Any', q, pageToken }) => {
  const safeClassLevel = Number(classLevel) || 10
  const safeSyllabus = String(syllabus || 'CBSE')
  const safeSubject = String(subject || 'Physics')
  const safeLanguage = normalizeLanguage(language)

  const query = q || `Class ${safeClassLevel} ${safeSyllabus} ${safeSubject}${safeLanguage ? ` ${safeLanguage}` : ''}`
  const cacheKey = `${query}|${pageToken || 'start'}`
  const now = Date.now()

  if (videoCache.has(cacheKey)) {
    const cached = videoCache.get(cacheKey)
    if (cached.expiresAt > now) {
      return cached.data
    }
    videoCache.delete(cacheKey)
  }

  if (!env.YOUTUBE_API_KEY || env.YOUTUBE_API_KEY === 'demo-key') {
    const fallback = fallbackVideos({ classLevel: safeClassLevel, syllabus: safeSyllabus, subject: safeSubject, language, q })
    const data = {
      items: fallback.slice(0, 6),
      nextPageToken: null,
      totalResults: fallback.length,
      query,
    }
    videoCache.set(cacheKey, { data, expiresAt: now + 10 * 60 * 1000 })
    return data
  }

  try {
    const params = {
      part: 'snippet',
      maxResults: 12,
      q: query,
      type: 'video',
      videoEmbeddable: true,
      safeSearch: 'strict',
      pageToken: pageToken || undefined,
    }

    if (safeLanguage && languageCodeMap[safeLanguage]) {
      params.relevanceLanguage = languageCodeMap[safeLanguage]
    }

    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        ...params,
        key: env.YOUTUBE_API_KEY,
      },
    })

    const videoIds = (searchResponse.data.items || []).map((item) => item.id.videoId).filter(Boolean)

    if (!videoIds.length) {
      const data = {
        items: [],
        nextPageToken: null,
        totalResults: 0,
        query,
      }
      videoCache.set(cacheKey, { data, expiresAt: now + 10 * 60 * 1000 })
      return data
    }

    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
        key: env.YOUTUBE_API_KEY,
      },
    })

    const items = (detailsResponse.data.items || []).map((item) =>
      normalizeVideo(item, safeSubject, safeClassLevel, safeSyllabus, safeLanguage || 'Any'),
    )

    const data = {
      items,
      nextPageToken: searchResponse.data.nextPageToken || null,
      totalResults: searchResponse.data.pageInfo?.totalResults || items.length,
      query,
    }

    videoCache.set(cacheKey, { data, expiresAt: now + 10 * 60 * 1000 })
    return data
  } catch (error) {
    const fallback = fallbackVideos({ classLevel: safeClassLevel, syllabus: safeSyllabus, subject: safeSubject, language, q })
    const data = {
      items: fallback.slice(0, 6),
      nextPageToken: null,
      totalResults: fallback.length,
      query,
    }
    videoCache.set(cacheKey, { data, expiresAt: now + 10 * 60 * 1000 })
    return data
  }
}

const getVideoDetails = async (videoId) => {
  if (!env.YOUTUBE_API_KEY || env.YOUTUBE_API_KEY === 'demo-key') {
    const fallback = mockVideos.find((item) => item.id === videoId)
    if (!fallback) {
      throw new Error('Video not found.')
    }
    return {
      ...fallback,
      channelTitle: fallback.channelTitle || fallback.channel || 'StudyTube',
      thumbnail: fallback.thumbnail || '',
      description: fallback.description || '',
      chapter: fallback.chapter || 'General',
      subject: fallback.subject || 'Physics',
      language: fallback.language || 'Any',
    }
  }

  const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: env.YOUTUBE_API_KEY,
    },
  })

  const item = response.data.items?.[0]
  if (!item) {
    throw new Error('Video not found.')
  }

  return normalizeVideo(item, 'General', null, null, 'Any')
}

module.exports = { searchVideos, getVideoDetails, videoCache }
