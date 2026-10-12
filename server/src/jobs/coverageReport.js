const mongoose = require('mongoose')
const CuratedVideo = require('../models/CuratedVideo')
const { env } = require('../config/env')

const classLevels = [8, 9, 10, 11, 12]
const syllabi = ['CBSE', 'ICSE', 'State']
const subjects = ['Physics', 'Chemistry', 'Biology', 'Maths', 'English', 'History']
const languages = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada']

async function printCoverage() {
  await mongoose.connect(env.MONGODB_URI)

  const rows = []
  for (const classLevel of classLevels) {
    for (const syllabus of syllabi) {
      for (const subject of subjects) {
        for (const language of languages) {
          const count = await CuratedVideo.countDocuments({
            classLevel,
            syllabus,
            subject,
            language,
            hidden: false,
          })

          rows.push({ classLevel, syllabus, subject, language, count })
        }
      }
    }
  }

  const missing = rows.filter((row) => row.count < 5)
  console.log('Class | Syllabus | Subject | Language | Count')
  console.log('-------------------------------------------')
  for (const row of rows) {
    console.log(`${row.classLevel} | ${row.syllabus} | ${row.subject} | ${row.language} | ${row.count}`)
  }

  console.log('\nMissing combinations (< 5):', missing.length)
  for (const row of missing.slice(0, 25)) {
    console.log(`${row.classLevel} | ${row.syllabus} | ${row.subject} | ${row.language} | ${row.count}`)
  }

  process.exit(0)
}

printCoverage().catch((error) => {
  console.error('Coverage report failed:', error.message)
  process.exit(1)
})
