const express = require('express')
const { listVideos, updateVideo, listChannels, listUsers, upsertChannel } = require('../controllers/adminController')
const { protect, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.use(protect, requireAdmin)
router.get('/videos', listVideos)
router.patch('/videos/:id', updateVideo)
router.get('/channels', listChannels)
router.get('/users', listUsers)
router.post('/channels', upsertChannel)

module.exports = router
