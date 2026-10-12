const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const Channel = require('../models/Channel')
const { env } = require('../config/env')

async function seedChannels() {
  await mongoose.connect(env.MONGODB_URI)

  const seedFile = path.join(__dirname, '../data/channels.seed.json')
  const raw = fs.readFileSync(seedFile, 'utf8')
  const seed = JSON.parse(raw)
  const channels = Array.isArray(seed.channels) ? seed.channels : []

  if (!channels.length) {
    console.log('No seed channels found.')
    process.exit(0)
  }

  const ops = channels.map((channel) => ({
    updateOne: {
      filter: { channelId: channel.channelId },
      update: { $set: channel },
      upsert: true,
    },
  }))

  await Channel.bulkWrite(ops)
  console.log(`Seeded ${channels.length} channel records.`)
  process.exit(0)
}

seedChannels().catch((error) => {
  console.error('Seed channels failed:', error.message)
  process.exit(1)
})
