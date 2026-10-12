const axios = require('axios')
const { env } = require('../../config/env')

const createYoutubeClient = () => {
  const apiKey = env.YOUTUBE_API_KEY || ''

  const request = async ({ endpoint, params }) => {
    if (!apiKey) {
      const error = new Error('YOUTUBE_API_KEY is not configured.')
      error.code = 'missing-api-key'
      throw error
    }

    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/${endpoint}`, {
        params: {
          ...params,
          key: apiKey,
        },
      })
      return response.data
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message

      if (status === 403 && /quota|dailyLimit|limitExceeded/i.test(message)) {
        const quotaError = new Error('YouTube API quota exceeded. Seeding stopped early.')
        quotaError.code = 'quotaExceeded'
        quotaError.details = message
        throw quotaError
      }

      if (status === 403) {
        const forbidden = new Error(`YouTube API access denied: ${message}`)
        forbidden.code = 'forbidden'
        throw forbidden
      }

      if (status === 404) {
        const notFound = new Error(`YouTube resource not found: ${message}`)
        notFound.code = 'notFound'
        throw notFound
      }

      const wrapped = new Error(`YouTube API request failed: ${message}`)
      wrapped.code = error.code || 'youtube-request-failed'
      throw wrapped
    }
  }

  return {
    async resolveChannelIdByHandle(handle) {
      const payload = await request({
        endpoint: 'channels',
        params: {
          part: 'id,snippet',
          forHandle: handle,
        },
      })

      return payload.items?.[0]?.id || null
    },

    async fetchChannelDetails(channelId) {
      const payload = await request({
        endpoint: 'channels',
        params: {
          part: 'snippet,contentDetails,statistics',
          id: channelId,
        },
      })

      return payload.items?.[0] || null
    },

    async fetchChannelsByIds(channelIds = []) {
      if (!channelIds.length) return []
      const payload = await request({
        endpoint: 'channels',
        params: {
          part: 'snippet,contentDetails,statistics',
          id: channelIds.join(','),
        },
      })
      return payload.items || []
    },

    async fetchVideosByIds(videoIds = []) {
      if (!videoIds.length) return []
      const payload = await request({
        endpoint: 'videos',
        params: {
          part: 'snippet,contentDetails,statistics,status',
          id: videoIds.join(','),
        },
      })
      return payload.items || []
    },
  }
}

module.exports = {
  createYoutubeClient,
}
