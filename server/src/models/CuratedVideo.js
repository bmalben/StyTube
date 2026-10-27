const mongoose = require('mongoose')

const curatedVideoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    channelId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    channelTitle: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    classLevel: {
      type: Number,
      min: 8,
      max: 12,
      default: 10,
    },
    syllabus: {
      type: String,
      default: 'CBSE',
    },
    subject: {
      type: String,
      default: 'Physics',
    },
    language: {
      type: String,
      default: 'English',
    },
    chapter: {
      type: String,
      default: '',
    },
    qualityScore: {
      type: Number,
      default: 0,
    },
    trustTier: {
      type: String,
      enum: ['verified-adlight', 'trusted', 'general'],
      default: 'general',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['manual', 'ingestion'],
      default: 'ingestion',
      index: true,
    },
    lastRefreshedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'curatedVideos',
  },
)

curatedVideoSchema.index({ classLevel: 1, syllabus: 1, subject: 1, language: 1, hidden: 1, pinned: 1, qualityScore: 1 })
curatedVideoSchema.index({ source: 1, videoId: 1 })

module.exports = mongoose.model('CuratedVideo', curatedVideoSchema)
