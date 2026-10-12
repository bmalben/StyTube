const { z } = require('zod')
const Report = require('../models/Report')

const reportSchema = z.object({
  videoId: z.string().trim().min(1),
  reason: z.enum(['wrong_subject', 'not_relevant', 'unsuitable', 'other']).default('wrong_subject'),
  details: z.string().trim().max(500).optional().or(z.literal('')),
})

const createReport = async (req, res, next) => {
  try {
    const payload = reportSchema.parse(req.body)
    const report = await Report.create({
      ...payload,
      user: req.user?._id || null,
    })

    return res.status(201).json({ report })
  } catch (error) {
    next(error)
  }
}

module.exports = { createReport }
