const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('./models/User')
const { env } = require('./config/env')

const runSeed = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI)

    const existing = await User.findOne({ email: 'demo@studenttube.in' })
    if (existing) {
      console.log('Seed user already exists.')
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash('demo1234', 12)
    await User.create({
      name: 'Demo Student',
      email: 'demo@studenttube.in',
      passwordHash,
      preferences: {
        classLevel: 10,
        syllabus: 'CBSE',
        subject: 'Physics',
        language: 'English',
      },
    })

    console.log('Demo user created: demo@studenttube.in / demo1234')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
}

runSeed()
