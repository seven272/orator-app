import express from 'express'
import { completeExercise } from '../controllers/exerciseController.js'

import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/complete', checkAuth, completeExercise)

export default router
