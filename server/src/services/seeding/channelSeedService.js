const fs = require('fs')
const path = require('path')
const { parseChannelSeed } = require('./validators')
const { isPlaceholderEntry } = require('./placeholder')
const { parseCsvRows } = require('./csv')
const { createYoutubeClient } = require('./youtubeClient')
const Channel = require('../../models/Channel')

const isAllowedFile = (filePath = '') => ['.json', '.csv'].includes(path.extname(filePath).toLowerCase())

const loadSeedEntries = (filePath) => {
  const absolutePath = path.resolve(filePath)
  const raw = fs.readFileSync(absolutePath, 'utf8')
  const extension = path.extname(absolutePath).toLowerCase()

  if (extension === '.json') {
    const payload = JSON.parse(raw)
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.channels)) return payload.channels
    return []
  }

  if (extension === '.csv') {
    return parseCsvRows(raw)
  }

  throw new Error('Unsupported seed file type. Use .json or .csv.')
}

const mergeChannelPayload = (existing, next, force = false) => {
  const base = { ...next }

  if (!force && existing) {
    base.active = existing.active
    base.notes = existing.notes || next.notes
  }

  return base
}

const seedChannels = async ({ filePath, dryRun = false, force = false, only = '', youtubeClient = createYoutubeClient() }) => {
  const summary = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skippedPlaceholder: 0,
    failed: [],
    quotaUnitsUsed: 0,
  }

  const absolutePath = path.resolve(filePath || path.join(__dirname, '../../data/channels.seed.json'))
  if (!isAllowedFile(absolutePath)) {
    throw new Error('Unsupported seed file type. Use .json or .csv.')
  }

  const entries = loadSeedEntries(absolutePath)
  const filtered = entries.filter((entry) => (!only ? true : String(entry.channelId || entry.handle || '').toLowerCase() === String(only).trim().toLowerCase()))

  for (const entry of filtered) {
    if (isPlaceholderEntry(entry)) {
      summary.skippedPlaceholder += 1
      continue
    }

    try {
      const parsed = parseChannelSeed(entry)
      let channelId = parsed.channelId || ''

      if (!channelId && parsed.handle) {
        channelId = await youtubeClient.resolveChannelIdByHandle(parsed.handle)
        summary.quotaUnitsUsed += 1
        if (!channelId) {
          throw new Error(`Channel handle ${parsed.handle} did not resolve.`)
        }
      }

      if (!/^UC[A-Za-z0-9]{22}$/.test(channelId)) {
        throw new Error(`Invalid channelId: ${channelId}`)
      }

      const details = await youtubeClient.fetchChannelDetails(channelId)
      summary.quotaUnitsUsed += 1

      if (!details) {
        throw new Error(`Channel ${channelId} could not be verified in YouTube.`)
      }

      const normalized = {
        channelId,
        name: details.snippet?.title || parsed.name,
        trustTier: parsed.trustTier,
        classLevels: [...new Set((parsed.classLevels || []).map((value) => Number(value)))],
        syllabi: [...new Set((parsed.syllabi || []).map((item) => String(item).trim().toLowerCase()))],
        subjects: [...new Set((parsed.subjects || []).map((item) => String(item).trim()))],
        languages: [...new Set((parsed.languages || []).map((item) => String(item).trim().toLowerCase()))],
        uploadsPlaylistId: details.contentDetails?.relatedPlaylists?.uploads || '',
        extraPlaylistIds: [...new Set((parsed.extraPlaylistIds || []).map((item) => String(item).trim()))],
        notes: parsed.notes || `Verified via YouTube: ${details.snippet?.customUrl || 'channel metadata'}`,
        active: parsed.active,
      }

      const existing = await Channel.findOne({ channelId }).lean()
      if (!dryRun) {
        const merged = mergeChannelPayload(existing, normalized, force)
        const result = await Channel.updateOne({ channelId }, { $set: merged }, { upsert: true })

        if (!existing) {
          summary.inserted += 1
        } else if (result.modifiedCount > 0 || result.upsertedCount > 0) {
          summary.updated += 1
        } else {
          summary.unchanged += 1
        }
      } else {
        if (!existing) {
          summary.inserted += 1
        } else {
          summary.unchanged += 1
        }
      }
    } catch (error) {
      summary.failed.push({ entry: entry.channelId || entry.handle || 'unknown', reason: error.message })
    }
  }

  return summary
}

module.exports = {
  seedChannels,
  loadSeedEntries,
}
