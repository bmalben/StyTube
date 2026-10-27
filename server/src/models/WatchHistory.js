const mongoose = require('mongoose')

const watchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    channelTitle: {
      type: String,
    },
    classLevel: {
      type: Number,
    },
    syllabus: {
      type: String,
    },
    subject: {
      type: String,
    },
    language: {
      type: String,
      default: 'Any',
    },
    progressSeconds: {
      type: Number,
      default: 0,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'watchHistories',
  },
)

watchHistorySchema.index({ user: 1, videoId: 1 }, { unique: true })

module.exports = mongoose.model('WatchHistory', watchHistorySchema)
