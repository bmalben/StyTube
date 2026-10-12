const test = require('node:test')
const assert = require('node:assert/strict')
const { classifyVideo } = require('../classifier')

test('classifies class, board, language, subject, and chapter from video metadata', () => {
  const result = classifyVideo({
    title: 'Class 10 CBSE Physics Chapter 1 Electricity in Malayalam',
    description: 'Learn electric current and circuits clearly',
    channelName: 'ABC Academy',
    subjectHint: 'Physics',
    languageHint: 'Malayalam',
  })

  assert.equal(result.classLevel, 10)
  assert.equal(result.syllabus, 'CBSE')
  assert.equal(result.subject, 'Physics')
  assert.equal(result.language, 'Malayalam')
  assert.match(result.chapter || '', /electricity|chapter/i)
})
