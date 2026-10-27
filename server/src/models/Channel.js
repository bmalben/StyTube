const mongoose = require('mongoose')

const channelSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    handle: {
      type: String,
      trim: true,
      default: '',
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    trustTier: {
      type: String,
      enum: ['verified-adlight', 'trusted', 'general'],
      default: 'general',
    },
    classLevels: [{ type: Number }],
    syllabi: [{ type: String }],
    subjects: [{ type: String }],
    languages: [{ type: String }],
    uploadsPlaylistId: {
      type: String,
      default: '',
    },
    extraPlaylistIds: [{ type: String }],
    notes: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'channels',
  },
)

module.exports = mongoose.model('Channel', channelSchema)
