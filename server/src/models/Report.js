const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      enum: ['wrong_subject', 'not_relevant', 'unsuitable', 'other'],
      default: 'wrong_subject',
    },
    details: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Report', reportSchema)
