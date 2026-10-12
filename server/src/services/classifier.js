const SUBJECT_ALIASES = {
  physics: ['physics', 'physic', 'science'],
  chemistry: ['chemistry', 'chem', 'chemical'],
  biology: ['biology', 'bio'],
  maths: ['maths', 'math', 'mathematics', 'algebra', 'geometry'],
  english: ['english', 'grammar', 'literature'],
  history: ['history', 'social science', 'civics'],
  geography: ['geography', 'social studies'],
  economics: ['economics', 'business economics'],
  computerscience: ['computer science', 'cs', 'programming'],
}

const LANGUAGE_ALIASES = {
  english: ['english', 'eng'],
  hindi: ['hindi', 'hin'],
  malayalam: ['malayalam', 'ml', 'mal'],
  tamil: ['tamil', 'ta'],
  telugu: ['telugu', 'te'],
  kannada: ['kannada', 'kn'],
}

const normalize = (value = '') => String(value || '').trim().toLowerCase()

const detectClassLevel = (title = '', fallback = null) => {
  const source = normalize(`${title} ${fallback || ''}`)
  const match = source.match(/class\s*(8|9|10|11|12)/)
  if (match) return Number(match[1])
  return null
}

const detectSyllabus = (title = '', fallback = '') => {
  const source = normalize(`${title} ${fallback || ''}`)
  if (/cbse/.test(source)) return 'CBSE'
  if (/icse/.test(source)) return 'ICSE'
  if (/state|kerala|karnataka|maharashtra|tamilnadu|tn|ap|mp|up/.test(source)) return 'State'
  return 'CBSE'
}

const detectLanguage = (title = '', fallback = '') => {
  const source = normalize(`${title} ${fallback || ''}`)
  for (const [language, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if (aliases.some((alias) => source.includes(alias))) return language.charAt(0).toUpperCase() + language.slice(1)
  }
  return 'English'
}

const detectSubject = (title = '', fallback = '') => {
  const source = normalize(`${title} ${fallback || ''}`)
  for (const [subject, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (aliases.some((alias) => source.includes(alias))) {
      if (subject === 'maths') return 'Maths'
      if (subject === 'computerscience') return 'Computer Science'
      return subject.charAt(0).toUpperCase() + subject.slice(1)
    }
  }
  return 'Physics'
}

const detectChapter = (title = '') => {
  const source = normalize(title)
  const match = source.match(/chapter\s*[:\-]?\s*([a-z0-9 &]+)/)
  if (match) return match[1].replace(/\s+/g, ' ').trim()
  const chapterWords = ['light', 'electricity', 'motion', 'acids', 'biology', 'photosynthesis', 'vectors']
  const hit = chapterWords.find((word) => source.includes(word))
  return hit ? hit.charAt(0).toUpperCase() + hit.slice(1) : ''
}

function classifyVideo({ title = '', description = '', channelName = '', playlistName = '', subjectHint = '', languageHint = '', classLevelHint = null, syllabusHint = '' }) {
  const textBlob = `${title} ${description} ${channelName} ${playlistName} ${subjectHint} ${languageHint}`
  const classLevel = detectClassLevel(textBlob, classLevelHint)
  const syllabus = detectSyllabus(textBlob, syllabusHint)
  const language = detectLanguage(textBlob, languageHint)
  const subject = detectSubject(textBlob, subjectHint)
  const chapter = detectChapter(title)

  return {
    classLevel,
    syllabus,
    subject,
    language,
    chapter,
  }
}

module.exports = {
  classifyVideo,
  detectClassLevel,
  detectSyllabus,
  detectLanguage,
  detectSubject,
  detectChapter,
}
