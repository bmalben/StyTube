const express = require('express')
const {
  listVideos,
  updateVideo,
  createVideo,
  deleteVideo,
  listChannels,
  listUsers,
  upsertChannel,
  deleteChannel,
} = require('../controllers/adminController')
const { protect, requireAdmin, requireStudyTubeHeader } = require('../middleware/auth')

const router = express.Router()

router.use(protect, requireAdmin)
router.use(requireStudyTubeHeader)
router.get('/videos', listVideos)
router.post('/videos', createVideo)
router.patch('/videos/:id', updateVideo)
router.delete('/videos/:id', deleteVideo)
router.get('/channels', listChannels)
router.post('/channels', upsertChannel)
router.delete('/channels/:id', deleteChannel)
router.get('/users', listUsers)

module.exports = router
