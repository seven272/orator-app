import express from 'express'
import {
 createRoom,
  joinRoom,
  checkRoomStatus,
  submitRating,
  checkInviteToken,
  checkRatingStatus,
  getLiveDuelStats,
  uploadAudioTrack // Новый контроллер
} from '../controllers/liveDuelController.js'

import { checkAuth } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.js'

const router = express.Router()

// --- Живые дуэли между реальными пользователями ---
router.post('/create-room', checkAuth, createRoom)
router.post('/join-room', checkAuth, joinRoom)
router.post('/check-status', checkAuth, checkRoomStatus)
router.post('/submit-rating', checkAuth, submitRating)

router.post('/upload-audio', checkAuth, upload.single('audio'), uploadAudioTrack)


// --- Инвайты, статусы оценок и дашборд статистики ---
router.get('/check-invite/:token', checkAuth, checkInviteToken)
router.get('/rating-status/:roomId', checkAuth, checkRatingStatus)
router.get('/dashboard-stats', checkAuth, getLiveDuelStats)

export default router
