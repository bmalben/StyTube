const express = require('express')
const { protect } = require('../middleware/auth')
const {
  getHistory,
  upsertHistory,
  deleteHistoryByVideoId,
  clearHistory,
} = require('../controllers/historyController')

const router = express.Router()

router.use(protect)
router.get('/', getHistory)
router.post('/', upsertHistory)
router.delete('/:videoId', deleteHistoryByVideoId)
router.delete('/', clearHistory)

module.exports = router
