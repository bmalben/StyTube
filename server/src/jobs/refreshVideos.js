const mongoose = require('mongoose')
const axios = require('axios')
const Channel = require('../models/Channel')
const CuratedVideo = require('../models/CuratedVideo')
const { classifyVideo } = require('../services/classifier')
const { computeQualityScore } = require('../services/qualityScore')
const { env } = require('../config/env')
const mockVideos = require('../data/mockVideos')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const toSeconds = (isoDuration = '') => {
  if (!isoDuration) return 0
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

const buildMockCurations = async () => {
  const documents = mockVideos.map((video) => ({
    videoId: video.id,
    channelId: `mock-${video.channelTitle.toLowerCase().replace(/\s+/g, '-')}`,
    title: video.title,
    thumbnail: video.thumbnail,
    durationSeconds: Number(video.duration?.split(':').reduce((acc, part) => acc * 60 + Number(part), 0)) || 0,
    viewCount: Number(String(video.views).replace(/[^\d]/g, '')) || 0,
    likeCount: Math.round((Number(String(video.views).replace(/[^\d]/g, '')) || 0) * 0.07),
    publishedAt: new Date(video.publishedAt || Date.now()),
    classLevel: Number(video.classLevel || 10),
    syllabus: video.syllabus || 'CBSE',
    subject: video.subject || 'Physics',
    language: video.language || 'English',
    chapter: video.chapter || '',
    trustTier: 'general',
    qualityScore: 72,
    pinned: false,
    hidden: false,
    lastRefreshedAt: new Date(),
  }))

  for (const doc of documents) {
    await CuratedVideo.updateOne({ videoId: doc.videoId }, { $set: doc }, { upsert: true })
  }

  return documents.length
}

async function refreshVideos() {
  await mongoose.connect(env.MONGODB_URI)

  const activeChannels = await Channel.find({ active: true }).lean()
  if (!activeChannels.length) {
    console.log('No active channels found. Seeding default mock library instead.')
    const count = await buildMockCurations()
    console.log(`Imported ${count} mock curated videos.`)
    process.exit(0)
  }

  let totalImported = 0

  if (!env.YOUTUBE_API_KEY || env.YOUTUBE_API_KEY === 'demo-key') {
    const count = await buildMockCurations()
    console.log(`Using mock fallback dataset because YOUTUBE_API_KEY is not configured. Imported ${count} curated videos.`)
    process.exit(0)
  }

  for (const channel of activeChannels) {
    const playlists = [channel.uploadsPlaylistId, ...(channel.extraPlaylistIds || [])].filter(Boolean)

    for (const playlistId of playlists) {
      const playlistResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          key: env.YOUTUBE_API_KEY,
          part: 'snippet,status',
          playlistId,
          maxResults: 25,
        },
      })

      const itemIds = (playlistResponse.data.items || []).map((item) => item.snippet?.resourceId?.videoId).filter(Boolean)
      if (!itemIds.length) continue

      const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          key: env.YOUTUBE_API_KEY,
          part: 'snippet,contentDetails,status,statistics',
          id: itemIds.join(','),
        },
      })

      const items = (detailsResponse.data.items || []).filter((item) => {
        const status = item.status || {}
        return status.embeddable !== false && status.privacyStatus === 'public' && !status.madeForKids
      })

      for (const item of items) {
        const snippet = item.snippet || {}
        const stats = item.statistics || {}
        const durationSeconds = toSeconds(item.contentDetails?.duration || '')

        if (durationSeconds < 180 || durationSeconds > 5400) continue
        if (snippet.title?.toLowerCase().includes('shorts') || snippet.title?.toLowerCase().includes('live')) continue

        const classification = classifyVideo({
          title: snippet.title,
          description: snippet.description,
          channelName: snippet.channelTitle,
          playlistName: snippet.title,
          subjectHint: channel.subjects?.join(' ') || '',
          languageHint: channel.languages?.join(' ') || '',
          classLevelHint: channel.classLevels?.[0] || null,
          syllabusHint: channel.syllabi?.join(' ') || '',
        })

        const doc = {
          videoId: item.id,
          channelId: channel.channelId,
          title: snippet.title,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
          durationSeconds,
          viewCount: Number(stats.viewCount || 0),
          likeCount: Number(stats.likeCount || 0),
          publishedAt: snippet.publishedAt || new Date(),
          classLevel: classification.classLevel || channel.classLevels?.[0] || 10,
          syllabus: classification.syllabus || (channel.syllabi || ['CBSE'])[0] || 'CBSE',
          subject: classification.subject || (channel.subjects || ['Physics'])[0] || 'Physics',
          language: classification.language || (channel.languages || ['English'])[0] || 'English',
          chapter: classification.chapter || '',
          trustTier: channel.trustTier || 'general',
          qualityScore: computeQualityScore({
            likeCount: stats.likeCount,
            viewCount: stats.viewCount,
            publishedAt: snippet.publishedAt,
            title: snippet.title,
            trustTier: channel.trustTier || 'general',
          }),
          pinned: false,
          hidden: false,
          lastRefreshedAt: new Date(),
        }

        const existingManual = await CuratedVideo.findOne({ videoId: doc.videoId, source: 'manual' }).lean()
        if (existingManual) {
          continue
        }

        await CuratedVideo.updateOne({ videoId: doc.videoId }, { $set: { ...doc, source: 'ingestion' } }, { upsert: true })
        totalImported += 1
      }

      await sleep(120)
    }
  }

  console.log(`Refresh complete. Imported or updated ${totalImported} curated videos.`)
  process.exit(0)
}

refreshVideos().catch((error) => {
  console.error('Refresh failed:', error.message)
  process.exit(1)
})
