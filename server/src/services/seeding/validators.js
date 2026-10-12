const { z } = require('zod')

const syllabusEnum = ['state', 'cbse', 'icse']
const allowedLanguages = ['english', 'malayalam', 'hindi', 'tamil', 'kannada', 'telugu']
const trustTierEnum = ['verified-adlight', 'trusted', 'general']

const normalizeStringList = (value = []) =>
  (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)

const normalizeLowerList = (value = []) => normalizeStringList(value).map((item) => String(item).trim().toLowerCase())

const channelSeedSchema = z.object({
  name: z.string().trim().min(1),
  handle: z.string().trim().optional(),
  channelId: z.string().trim().optional(),
  trustTier: z.enum(trustTierEnum),
  classLevels: z.array(z.number().int().min(8).max(12)).default([]),
  syllabi: z.array(z.enum(syllabusEnum)).default([]),
  subjects: z.array(z.string().trim().min(1)).default([]),
  languages: z.array(z.enum(allowedLanguages)).default([]),
  extraPlaylistIds: z.array(z.string().trim()).default([]),
  notes: z.string().trim().default(''),
  active: z.boolean().default(true),
  _example: z.boolean().optional(),
}).refine((value) => Boolean(value.channelId) || Boolean(value.handle), {
  message: 'Each channel needs either channelId or handle.',
  path: ['channelId'],
})

const curatedVideoSeedSchema = z.object({
  videoId: z.string().trim().min(1),
  channelId: z.string().trim().optional(),
  classLevel: z.number().int().min(8).max(12),
  syllabus: z.enum(syllabusEnum),
  subject: z.string().trim().min(1),
  language: z.enum(allowedLanguages),
  chapter: z.string().trim().min(1),
  pinned: z.boolean().optional(),
  _example: z.boolean().optional(),
})

const parseChannelSeed = (raw = {}) => {
  const normalized = {
    ...raw,
    channelId: raw.channelId ? String(raw.channelId).trim() : '',
    handle: raw.handle ? String(raw.handle).trim() : '',
    name: raw.name ? String(raw.name).trim() : '',
    trustTier: String(raw.trustTier || 'general').trim().toLowerCase(),
    classLevels: (raw.classLevels || []).map((value) => Number(value)).filter((value) => Number.isInteger(value)),
    syllabi: normalizeLowerList(raw.syllabi || []),
    subjects: normalizeStringList(raw.subjects || []).map((value) => value.charAt(0).toUpperCase() + value.slice(1)),
    languages: normalizeLowerList(raw.languages || []),
    extraPlaylistIds: normalizeStringList(raw.extraPlaylistIds || []),
    notes: raw.notes ? String(raw.notes).trim() : '',
    active: raw.active !== undefined ? Boolean(raw.active) : true,
    _example: Boolean(raw._example),
  }

  return channelSeedSchema.parse(normalized)
}

const parseCuratedVideoSeed = (raw = {}) => {
  const normalized = {
    ...raw,
    videoId: raw.videoId ? String(raw.videoId).trim() : '',
    channelId: raw.channelId ? String(raw.channelId).trim() : '',
    classLevel: Number(raw.classLevel),
    syllabus: String(raw.syllabus || 'cbse').trim().toLowerCase(),
    subject: raw.subject ? String(raw.subject).trim() : '',
    language: String(raw.language || 'english').trim().toLowerCase(),
    chapter: raw.chapter ? String(raw.chapter).trim() : '',
    pinned: raw.pinned !== undefined ? Boolean(raw.pinned) : false,
    _example: Boolean(raw._example),
  }

  return curatedVideoSeedSchema.parse(normalized)
}

module.exports = {
  syllabusEnum,
  allowedLanguages,
  trustTierEnum,
  channelSeedSchema,
  curatedVideoSeedSchema,
  parseChannelSeed,
  parseCuratedVideoSeed,
}
