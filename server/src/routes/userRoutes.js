const express = require('express')
const { getPreferences, updatePreferences } = require('../controllers/userController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)
router.get('/preferences', getPreferences)
router.put('/preferences', updatePreferences)

module.exports = router
