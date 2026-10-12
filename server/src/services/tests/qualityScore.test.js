const test = require('node:test')
const assert = require('node:assert/strict')
const { computeQualityScore } = require('../qualityScore')

test('awards higher quality score to trusted educational channels and good titles', () => {
  const exact = computeQualityScore({
    likeCount: 2000,
    viewCount: 50000,
    publishedAt: '2024-01-10T00:00:00.000Z',
    title: 'Class 10 Physics Chapter Electricity Full Explanation',
    trustTier: 'verified-adlight',
  })

  const weak = computeQualityScore({
    likeCount: 100,
    viewCount: 50000,
    publishedAt: '2024-01-10T00:00:00.000Z',
    title: 'FREE GIFT FLASH SALE NOW',
    trustTier: 'general',
  })

  assert.ok(exact > weak)
})
