const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

const { buildAvatarUrl } = require('../../utils/avatar')
const photoRoutes = require('../../routes/photoRoutes')
const ProfilePhoto = require('../../models/ProfilePhoto')

let mongoServer
let app
let server

const originalPublicApiUrl = process.env.PUBLIC_API_URL

const resetEnv = () => {
  process.env.PUBLIC_API_URL = 'https://api.studytube.example'
}

test.before(async () => {
  resetEnv()
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  app = express()
  app.use('/api/photos', photoRoutes)
  server = app.listen(0)
})

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
  if (originalPublicApiUrl === undefined) {
    delete process.env.PUBLIC_API_URL
  } else {
    process.env.PUBLIC_API_URL = originalPublicApiUrl
  }
})

test('buildAvatarUrl uses the configured public API base', () => {
  const photoId = Array(25).join('a')
  assert.equal(buildAvatarUrl(photoId), 'https://api.studytube.example/api/photos/' + photoId)
})

test('public photo route returns the original WebP bytes and headers', async () => {
  const photoId = Array(25).join('a')
  const bytes = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])

  await ProfilePhoto.create({
    user: new mongoose.Types.ObjectId(),
    photoId,
    contentType: 'image/webp',
    data: bytes,
    size: bytes.length,
    width: 256,
    height: 256,
  })

  const port = server.address().port
  const response = await fetch(`http://127.0.0.1:${port}/api/photos/${photoId}`)
  const body = Buffer.from(await response.arrayBuffer())

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/webp')
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin')
  assert.equal(body.subarray(0, 4).toString('ascii'), 'RIFF')
  assert.equal(body.subarray(8, 12).toString('ascii'), 'WEBP')
  assert.equal(Buffer.compare(body, bytes), 0)
})
