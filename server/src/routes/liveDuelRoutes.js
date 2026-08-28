import express from 'express'
import multer from 'multer'
import {
  createRoom,
  joinRoom,
  checkRoomStatus,
  submitRating,
  getCalendarRooms,
  getMyActiveSlots,
  updateSlotDate,
  deleteSlot,
  checkInviteToken,
  checkRatingStatus,
  getLiveDuelStats,
} from '../controllers/liveDuelController.js'
import {
  startLiveDuelAi,
  sendLiveDuelAiMessage,
  finishLiveDuelAi,
} from '../controllers/liveDuelAiController.js'
import { checkAuth } from '../middlewares/authMiddleware.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ максимум
})

const router = express.Router()

router.post('/create-room', checkAuth, createRoom)
router.post('/join-room', checkAuth, joinRoom)
router.post('/check-status', checkAuth, checkRoomStatus)
router.post('/submit-rating', checkAuth, submitRating)
router.get('/calendar-rooms', checkAuth, getCalendarRooms)
router.get('/my-slots', checkAuth, getMyActiveSlots)
router.get('/check-invite/:token', checkAuth, checkInviteToken)
router.get('/rating-status/:roomId', checkAuth, checkRatingStatus)
router.get('/dashboard-stats', checkAuth, getLiveDuelStats)
router.put('/update-slot', checkAuth, updateSlotDate)
router.delete('/delete-slot/:roomId', checkAuth, deleteSlot)

router.post('/start-ai', checkAuth, startLiveDuelAi)
router.post(
  '/send-ai-message',
  checkAuth,
  upload.single('audio'),
  sendLiveDuelAiMessage,
)
router.post('/finish-ai', checkAuth, finishLiveDuelAi)

export default router
