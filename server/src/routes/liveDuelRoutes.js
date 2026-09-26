import express from 'express'
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
  updateCallLink
} from '../controllers/liveDuelController.js'

import { checkAuth } from '../middlewares/authMiddleware.js'


const router = express.Router()

// --- Живые дуэли между реальными пользователями ---
router.post('/create-room', checkAuth, createRoom)
router.post('/join-room', checkAuth, joinRoom)
router.post('/check-status', checkAuth, checkRoomStatus)
router.post('/submit-rating', checkAuth, submitRating)
router.post('/update-call-link', checkAuth, updateCallLink)

// --- Календарь и сетка расписания поединков ---
router.get('/calendar-rooms', checkAuth, getCalendarRooms)
router.get('/my-slots', checkAuth, getMyActiveSlots)
router.put('/update-slot', checkAuth, updateSlotDate)
router.delete('/delete-slot/:roomId', checkAuth, deleteSlot)

// --- Инвайты, статусы оценок и дашборд статистики ---
router.get('/check-invite/:token', checkAuth, checkInviteToken)
router.get('/rating-status/:roomId', checkAuth, checkRatingStatus)
router.get('/dashboard-stats', checkAuth, getLiveDuelStats)

export default router
