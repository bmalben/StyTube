const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const likeRatio = (likes, views) => {
  const safeViews = Math.max(Number(views) || 0, 1)
  const safeLikes = Number(likes) || 0
  return (safeLikes + 5) / (safeViews + 25)
}

const recencyFactor = (publishedAt) => {
  const then = new Date(publishedAt).getTime()
  const diffDays = Math.max((Date.now() - then) / (1000 * 60 * 60 * 24), 0)
  const decay = Math.exp(-diffDays / 550)
  return clamp(decay * 1.1, 0.45, 1)
}

const titleHeuristics = (title = '') => {
  const normalized = String(title || '').toLowerCase()
  let score = 0

  if (/[A-Z]{4,}/.test(title) && !normalized.includes('ncert')) score -= 12
  if (/shorts|live|stream|free gift|telegram|offer|click here|limited time/i.test(normalized)) score -= 18
  if (/chapter|concept|explained|full explanation|ncert|important questions|formula/i.test(normalized)) score += 14

  return score
}

const trustBonus = (trustTier = 'general') => {
  const mapping = { 'verified-adlight': 18, trusted: 10, general: 0 }
  return mapping[trustTier] || 0
}

function computeQualityScore({ likeCount = 0, viewCount = 0, publishedAt = new Date().toISOString(), title = '', trustTier = 'general' }) {
  const safeViews = Math.max(Number(viewCount) || 0, 0)
  const safeLikes = Math.max(Number(likeCount) || 0, 0)

  if (safeViews === 0 && safeLikes === 0) {
    return 20 + trustBonus(trustTier)
  }

  const ratio = likeRatio(safeLikes, safeViews) * 100
  const viewBoost = Math.log10(safeViews + 1) * 10
  const recency = recencyFactor(publishedAt) * 20
  const titleBonus = titleHeuristics(title)
  const trust = trustBonus(trustTier)

  const score = ratio * 0.5 + viewBoost * 0.35 + recency * 0.7 + titleBonus + trust
  return clamp(Math.round(score), 0, 100)
}

module.exports = {
  computeQualityScore,
  titleHeuristics,
  trustBonus,
}
