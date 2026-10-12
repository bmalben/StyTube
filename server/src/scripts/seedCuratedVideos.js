#!/usr/bin/env node

const path = require('path')
const mongoose = require('mongoose')
const { env } = require('../config/env')
const { seedCuratedVideos } = require('../services/seeding/videoSeedService')
const { createYoutubeClient } = require('../services/seeding/youtubeClient')

const parseArgs = (argv) => {
  const args = { dryRun: false, file: path.join(__dirname, '../data/curatedVideos.seed.json'), only: '', prune: false }

  for (const token of argv) {
    if (token === '--dry-run') args.dryRun = true
    if (token === '--prune') args.prune = true
    if (token.startsWith('--file=')) args.file = token.split('=')[1]
    if (token.startsWith('--only=')) args.only = token.split('=')[1]
  }

  return args
}

const printSummary = (summary) => {
  console.table([
    {
      inserted: summary.inserted,
      updated: summary.updated,
      unchanged: summary.unchanged,
      skippedPlaceholder: summary.skippedPlaceholder,
      rejected: summary.rejected.length,
      quotaUnitsUsed: summary.quotaUnitsUsed,
    },
  ])

  if (summary.rejected.length) {
    console.log('Rejected entries:')
    for (const failure of summary.rejected) {
      console.log(`- ${failure.videoId}: ${failure.reason}`)
    }
  }

  if (summary.pruneCandidates?.length) {
    console.log('Prune candidates:')
    for (const videoId of summary.pruneCandidates) {
      console.log(`- ${videoId}`)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Check server/.env.')
  }

  const youtubeClient = createYoutubeClient()
  await mongoose.connect(env.MONGODB_URI)

  try {
    const summary = await seedCuratedVideos({
      filePath: args.file,
      dryRun: args.dryRun,
      only: args.only,
      prune: args.prune,
      youtubeClient,
    })
    printSummary(summary)
    if (summary.rejected.some((entry) => /quota/i.test(entry.reason || ''))) {
      process.exitCode = 1
    }
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Seed curated videos failed:', error.message)
  process.exitCode = 1
})
