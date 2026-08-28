import express from 'express'
import multer from 'multer'

import {
  getCourseProgress,
  startCourse,
  submitTheory,
  submitIrlReport,
  submitExamReport,
  unlockExamWithCoins,
  restartCourse,
  getUserCoursesArchive,
} from '../controllers/courseController.js'

import aiCourseSimulatorRouter from './aiCourseSimulatorRoutes.js';

import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Настройка multer для удержания аудио в оперативной памяти (Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Максимум 10 МБ на реплику
})


// 1. Получить актуальный прогресс пользователя по конкретному курсу
router.get('/progress/:courseCode', checkAuth, getCourseProgress)

// 2. Старт курса (Блок 1: создание записи UserCourseProgress)
router.post('/start', checkAuth, startCourse)

// 3. Проверка ответа на квиз (Завершение Блока 1 и переход к Блоку 2)
router.post('/submit-theory', checkAuth, submitTheory)

// 4. Сдача текстового отчета по реальной практике (Завершение Блока 3 и переход к Блоку 4)
router.post('/submit-irl', checkAuth, submitIrlReport)

// 5 Роут для  сдачи экзамена 
router.post('/exam/submit', checkAuth, upload.single('audio'), submitExamReport)

// 6 Роут для досрочного выкупа попытки за монеты (принимает { courseCode })
router.post('/exam/unlock', checkAuth, unlockExamWithCoins)

// 7 Роут перезапуск курса
router.post('/restart', checkAuth, restartCourse)

// 7 Роут получения списка пройденных курсов
router.get('/archive', checkAuth, getUserCoursesArchive)

// Все ИИ-контроллеры изолированы под эндпоинтом /simulate
router.use('/simulate', aiCourseSimulatorRouter)

export default router
