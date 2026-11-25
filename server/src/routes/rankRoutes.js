import express from 'express'
import multer from 'multer'

import { checkAuth } from '../middlewares/authMiddleware.js'
import {
  getRankProgressController,
  rankUpController,
  submitRealTaskController,
} from '../controllers/rankController.js'
import {
  startRankExam,
  responseRankExam,
  finishRankExam,
} from '../controllers/rankExamController.js'

const router = express.Router()


// Настройка multer для удержания аудио в оперативной памяти (Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Максимум 10 МБ на реплику
})


router.get('/progress', checkAuth, getRankProgressController)
router.post('/upgrade', checkAuth, rankUpController)
router.post('/real-task', checkAuth, submitRealTaskController)

// Ранговые экзамены (монолог + ИИ-судья)
router.post('/exam/start', checkAuth, startRankExam)
router.post(
  '/exam/response',
  checkAuth,
  upload.single('audio'),
  responseRankExam,
)
router.post('/exam/finish', checkAuth, finishRankExam)

export default router
