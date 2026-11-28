import express from 'express'
import {
  getEventsList,
  getEventById,
  registerOrCreateEventPayment,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
} from '../controllers/eventController.js'
import {
  checkAuth,
  optionalAuth,
  checkAdmin,
} from '../middlewares/authMiddleware.js'

const router = express.Router()

// Публичные / гостевые маршруты (optionalAuth)
router.get('/', optionalAuth, getEventsList)
router.get('/:id', optionalAuth, getEventById)

// Запись на бесплатное событие или создание платежа в ЮKassa (checkAuth)
router.post('/:id/register', checkAuth, registerOrCreateEventPayment)

// Админские маршруты (checkAuth + checkAdmin)
router.post('/', checkAuth, checkAdmin, createEvent)
router.put('/:id', checkAuth, checkAdmin, updateEvent)
router.delete('/:id', checkAuth, checkAdmin, deleteEvent)
router.get('/:id/participants', checkAuth, checkAdmin, getEventParticipants)

export default router
