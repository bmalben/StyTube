const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { env } = require('./env')

let memoryServer

const connectDatabase = async () => {
  let mongoUri = env.MONGODB_URI

  if (mongoUri === 'mongodb-memory://localhost') {
    memoryServer = await MongoMemoryServer.create()
    mongoUri = memoryServer.getUri()
    console.log('Using MongoDB Memory Server for local development.')
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(mongoUri)
  console.log('MongoDB connected successfully.')
}

const disconnectDatabase = async () => {
  await mongoose.disconnect()
  if (memoryServer) {
    await memoryServer.stop()
  }
}

module.exports = { connectDatabase, disconnectDatabase }
