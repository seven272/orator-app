import express from 'express'
import { completeExercise } from '../controllers/exerciseController.js'

import { optionalAuth } from '../middlewares/authMiddleware.js'
import { checkAndConsumeEnergy } from '../middlewares/exerciseMiddleware.js'

const router = express.Router()

router.post('/complete', optionalAuth, checkAndConsumeEnergy, completeExercise)

export default router
