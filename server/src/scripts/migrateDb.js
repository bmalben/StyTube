#!/usr/bin/env node

const mongoose = require('mongoose')
const { env } = require('../config/env')
const User = require('../models/User')
const Channel = require('../models/Channel')
const CuratedVideo = require('../models/CuratedVideo')

const parseArgs = (argv) => {
  const args = { dryRun: false }
  for (const token of argv) {
    if (token === '--dry-run') args.dryRun = true
  }
  return args
}

const printBackupReminder = () => {
  console.log('Reminder: take an Atlas backup/snapshot before running the real migration.')
}

async function ensureIndexes() {
  const channelIndex = await Channel.collection.indexExists('channelId_1')
  if (!channelIndex) {
    await Channel.collection.createIndex({ channelId: 1 }, { unique: true })
  }

  const videoIndex = await CuratedVideo.collection.indexExists('videoId_1')
  if (!videoIndex) {
    await CuratedVideo.collection.createIndex({ videoId: 1 }, { unique: true })
  }

  const compoundIndex = await CuratedVideo.collection.indexExists('classLevel_1_syllabus_1_subject_1_language_1_hidden_1_pinned_1_qualityScore_1')
  if (!compoundIndex) {
    await CuratedVideo.collection.createIndex({ classLevel: 1, syllabus: 1, subject: 1, language: 1, hidden: 1, pinned: 1, qualityScore: 1 })
  }
}

async function backfillDefaults() {
  await User.updateMany({ role: { $exists: false } }, { $set: { role: 'user' } })
  await User.updateMany({ 'preferences.classLevel': { $exists: false } }, { $set: { 'preferences.classLevel': 10 } })
  await User.updateMany({ 'preferences.syllabus': { $exists: false } }, { $set: { 'preferences.syllabus': 'CBSE' } })
  await User.updateMany({ 'preferences.subject': { $exists: false } }, { $set: { 'preferences.subject': 'Physics' } })
  await User.updateMany({ 'preferences.language': { $exists: false } }, { $set: { 'preferences.language': 'Any' } })

  await CuratedVideo.updateMany({ source: { $exists: false } }, { $set: { source: 'ingestion' } })
  await CuratedVideo.updateMany({ hidden: { $exists: false } }, { $set: { hidden: false } })
  await CuratedVideo.updateMany({ pinned: { $exists: false } }, { $set: { pinned: false } })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Check server/.env.')
  }

  printBackupReminder()
  await mongoose.connect(env.MONGODB_URI)

  try {
    if (args.dryRun) {
      console.log('Dry run: no writes performed.')
      console.log('Planned default backfills: role, hidden, pinned, source, preference defaults')
      console.log('Planned index creation: channelId unique, videoId unique, compound video filter index')
      return
    }

    await backfillDefaults()
    await ensureIndexes()
    console.log('Database migration completed.')
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('db migrate failed:', error.message)
  process.exitCode = 1
})
