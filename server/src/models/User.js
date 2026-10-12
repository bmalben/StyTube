const mongoose = require('mongoose')

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
  },
)

userSchema.methods.toPublicJSON = function () {
  const user = this.toObject()
  delete user.passwordHash
  return user
}

module.exports = mongoose.model('User', userSchema)
