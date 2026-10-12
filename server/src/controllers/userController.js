const { z } = require('zod')
const User = require('../models/User')

const preferencesSchema = z.object({
  classLevel: z.coerce.number().int().min(8).max(12).optional(),
  syllabus: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  language: z.string().trim().optional(),
})

const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash')
    return res.json({ preferences: user.preferences })
  } catch (error) {
    next(error)
  }
}

const updatePreferences = async (req, res, next) => {
  try {
    const payload = preferencesSchema.parse(req.body)
    const user = await User.findById(req.user._id)

    user.preferences = {
      ...user.preferences,
      ...payload,
    }

    await user.save()
    return res.json({ preferences: user.preferences })
  } catch (error) {
    next(error)
  }
}

module.exports = { getPreferences, updatePreferences }
