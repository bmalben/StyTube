const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveFallbackMatches } = require('../fallbackLadder')

test('fallback ladder prefers exact matches before broader language and syllabus fallback', () => {
  const exact = resolveFallbackMatches({
    exact: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
    anyLanguage: [{ id: 'f' }],
    otherSyllabus: [{ id: 'g' }],
    youtubeFallback: [{ id: 'h' }],
    language: 'Malayalam',
  })

  assert.equal(exact.fallbackLevel, 'exact')
  assert.equal(exact.items.length, 5)
})

test('when exact results are sparse it moves to language fallback', () => {
  const fallback = resolveFallbackMatches({
    exact: [{ id: 'a' }, { id: 'b' }],
    anyLanguage: [{ id: 'c' }, { id: 'd' }, { id: 'e' }],
    otherSyllabus: [],
    youtubeFallback: [],
    language: 'Malayalam',
  })

  assert.equal(fallback.fallbackLevel, 'language')
  assert.equal(fallback.items.length, 5)
})
