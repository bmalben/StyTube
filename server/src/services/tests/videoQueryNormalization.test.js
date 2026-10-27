const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const CuratedVideo = require('../../models/CuratedVideo')
const { getVideos } = require('../../controllers/videoController')

test('public video query accepts lowercase defaults and legacy records without hidden flag', async () => {
  const mongo = await MongoMemoryServer.create()

  try {
    await mongoose.connect(mongo.getUri())
    await CuratedVideo.deleteMany({})

    await CuratedVideo.create({
      videoId: 'legacy-video-1',
      channelId: 'channel-123',
      title: 'Legacy demo video',
      classLevel: 10,
      syllabus: 'CBSE',
      subject: 'Physics',
      language: 'English',
      chapter: 'Light',
      qualityScore: 88,
      source: 'ingestion',
    })

    let payload
    const req = {
      query: {
        classLevel: '10',
        syllabus: 'cbse',
        subject: 'physics',
        language: 'Any',
      },
    }
    const res = {
      json: (nextPayload) => {
        payload = nextPayload
        return nextPayload
      },
    }

    await getVideos(req, res, (error) => {
      throw error
    })

    assert.ok(Array.isArray(payload.items), 'expected items list in response')
    assert.ok(
      payload.items.some((item) => item.title === 'Legacy demo video'),
      `expected legacy curated video in the response, got: ${payload.items.map((item) => item.title).join(', ')}`,
    )
  } finally {
    await mongoose.disconnect()
    await mongo.stop()
  }
})
