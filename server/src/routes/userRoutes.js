const express = require('express')
const { getPreferences, updatePreferences } = require('../controllers/userController')
const { protect, requireStudyTubeHeader } = require('../middleware/auth')

const router = express.Router()

router.use(protect)
router.use(requireStudyTubeHeader)
router.get('/preferences', getPreferences)
router.put('/preferences', updatePreferences)

module.exports = router
