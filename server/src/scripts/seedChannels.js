#!/usr/bin/env node

const path = require('path')
const mongoose = require('mongoose')
const { env } = require('../config/env')
const { seedChannels } = require('../services/seeding/channelSeedService')
const { createYoutubeClient } = require('../services/seeding/youtubeClient')

const parseArgs = (argv) => {
  const args = { dryRun: false, force: false, file: path.join(__dirname, '../data/channels.seed.json'), only: '' }

  for (const token of argv) {
    if (token === '--dry-run') args.dryRun = true
    if (token === '--force') args.force = true
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
      failed: summary.failed.length,
      quotaUnitsUsed: summary.quotaUnitsUsed,
    },
  ])

  if (summary.failed.length) {
    console.log('Failed entries:')
    for (const failure of summary.failed) {
      console.log(`- ${failure.entry}: ${failure.reason}`)
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
    const summary = await seedChannels({
      filePath: args.file,
      dryRun: args.dryRun,
      force: args.force,
      only: args.only,
      youtubeClient,
    })
    printSummary(summary)
    if (summary.failed.some((entry) => /quota|limitExceeded/i.test(entry.reason || ''))) {
      process.exitCode = 1
    }
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Seed channels failed:', error.message)
  process.exitCode = 1
})
