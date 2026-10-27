const mongoose = require('mongoose')

const profilePhotoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    photoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^[a-f0-9]{24}$/,
    },
    contentType: {
      type: String,
      default: 'image/webp',
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'profilePhotos',
  },
)

module.exports = mongoose.model('ProfilePhoto', profilePhotoSchema)
