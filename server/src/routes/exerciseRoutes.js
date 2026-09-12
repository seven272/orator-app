import express from 'express'
import { completeExercise } from '../controllers/exerciseController.js'

import { optionalAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/complete', optionalAuth, completeExercise)

export default router
