const EMPTY_NOTE = 'No matching videos found in the curated library yet.'

function resolveFallbackMatches({ exact = [], anyLanguage = [], otherSyllabus = [], youtubeFallback = [], language = 'Any' }) {
  const ordered = [...exact, ...anyLanguage, ...otherSyllabus, ...youtubeFallback]
  const all = ordered.slice(0, 5)

  let fallbackLevel = 'exact'
  if (exact.length >= 5) {
    fallbackLevel = 'exact'
  } else if (anyLanguage.length >= 1 || exact.length > 0) {
    fallbackLevel = 'language'
  } else if (otherSyllabus.length >= 1) {
    fallbackLevel = 'syllabus'
  } else if (youtubeFallback.length > 0) {
    fallbackLevel = 'search'
  }

  let note = ''
  if (fallbackLevel === 'language') {
    note = `Showing videos from other languages because fewer than 5 exact matches were found for ${language}.`
  } else if (fallbackLevel === 'syllabus') {
    note = 'Showing videos from other syllabi because fewer than 5 exact matches were found.'
  } else if (fallbackLevel === 'search') {
    note = 'Showing YouTube search results because the curated set is still sparse.'
  } else if (all.length === 0) {
    note = EMPTY_NOTE
  }

  return {
    items: all,
    fallbackLevel,
    note,
  }
}

module.exports = { resolveFallbackMatches }
