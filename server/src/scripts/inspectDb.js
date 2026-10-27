#!/usr/bin/env node

const mongoose = require('mongoose')
const { env } = require('../config/env')

const redactValue = (value) => {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower.includes('token') || lower.includes('secret') || lower.includes('password')) return '[redacted]'
    return value.length > 40 ? `${value.slice(0, 20)}…${value.slice(-8)}` : value
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item))
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => {
        if (['email', 'passwordHash', 'password', 'token', 'accessToken', 'refreshToken'].includes(key.toLowerCase())) {
          return [key, '[redacted]']
        }
        return [key, redactValue(nested)]
      }),
    )
  }
  return value
}

const getFieldSummary = (docs) => {
  const fieldMap = new Map()
  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc)) {
      const typeName = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
      const types = fieldMap.get(key) || new Set()
      types.add(typeName)
      fieldMap.set(key, types)
    }
  }
  return Object.fromEntries(
    [...fieldMap.entries()].map(([field, types]) => [field, [...types].sort()]),
  )
}

const printCollectionReport = async (name) => {
  const collection = mongoose.connection.db.collection(name)
  const count = await collection.countDocuments()
  const indexes = await collection.indexInformation()
  const samples = await collection.find({}).limit(5).toArray()

  console.log(`\nCOLLECTION: ${name}`)
  console.log(`documents: ${count}`)
  console.log('indexes:', Object.keys(indexes))

  if (samples.length) {
    const cleaned = samples.map((doc) => redactValue(doc))
    console.log('field names and types:')
    console.log(JSON.stringify(getFieldSummary(cleaned), null, 2))
    console.log('sample docs:')
    console.log(JSON.stringify(cleaned, null, 2))
  }
}

const printModelMapping = () => {
  console.log('\nMODEL => COLLECTION REPORT')
  const modelNames = ['User', 'WatchHistory', 'Channel', 'CuratedVideo', 'Report', 'AuditLog']
  const rows = modelNames.map((name) => {
    const model = mongoose.models[name]
    return {
      model: name,
      collection: model ? model.collection.name : 'missing-model',
      status: model ? 'match' : 'missing',
    }
  })
  console.log(JSON.stringify(rows, null, 2))
}

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Check server/.env.')
  }

  await mongoose.connect(env.MONGODB_URI)
  try {
    const collectionNames = await mongoose.connection.db.listCollections().toArray()
    for (const { name } of collectionNames) {
      await printCollectionReport(name)
    }
    printModelMapping()
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('db inspect failed:', error.message)
  process.exitCode = 1
})
