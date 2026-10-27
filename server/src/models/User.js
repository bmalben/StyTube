const mongoose = require('mongoose')
const { serializeUser } = require('../utils/avatar')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      photoId: {
        type: String,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    preferences: {
      classLevel: {
        type: Number,
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
        default: 'Any',
      },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
)

userSchema.methods.toPublicJSON = function (req = null) {
  return serializeUser(this, req)
}

userSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return
  const ProfilePhoto = require('./ProfilePhoto')
  await ProfilePhoto.deleteMany({ user: doc._id })
})

userSchema.post('deleteOne', async function () {
  const doc = await this.model.findOne(this.getFilter())
  if (!doc) return
  const ProfilePhoto = require('./ProfilePhoto')
  await ProfilePhoto.deleteMany({ user: doc._id })
})

module.exports = mongoose.model('User', userSchema)
