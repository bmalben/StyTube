const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const normalizeText = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')

export const buildSearchQuery = ({ classLevel, syllabus, subject, chapter = '', language = 'Any' }) => {
  const cleanSubject = subject || 'Physics'
  const cleanChapter = chapter ? ` ${chapter}` : ''
  const board = syllabus || 'CBSE'
  const languageText = language && language !== 'Any' ? ` ${language}` : ''
  return `Class ${classLevel} ${board} ${cleanSubject}${languageText}${cleanChapter}`
}

export async function searchVideos({ classLevel, syllabus, subject, pageToken = null, chapter = '', language = 'Any', q = '' }) {
  const normalizedClass = Number(classLevel) || 10
  const normalizedBoard = String(syllabus || 'CBSE')
  const normalizedSubject = String(subject || 'Physics')
  const normalizedLanguage = String(language || 'Any')
  const params = new URLSearchParams({
    classLevel: String(normalizedClass),
    syllabus: normalizedBoard,
    subject: normalizedSubject,
    language: normalizedLanguage,
  })

  if (pageToken) {
    params.set('pageToken', pageToken)
  }

  if (chapter) {
    params.set('q', chapter)
  } else if (q) {
    params.set('q', q)
  }

  const response = await fetch(`${API_URL}/api/videos?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Unable to load videos right now.' }))
    throw new Error(payload.message || 'Unable to load videos right now.')
  }

  const data = await response.json()
  const items = Array.isArray(data.items) ? data.items : []

  return {
    items,
    nextPageToken: data.nextPageToken ?? null,
    totalResults: data.totalResults ?? items.length,
    fallbackLevel: data.fallbackLevel ?? 'exact',
    note: data.note || '',
    query: data.query || buildSearchQuery({ classLevel: normalizedClass, syllabus: normalizedBoard, subject: normalizedSubject, chapter, language: normalizedLanguage }),
  }
}
