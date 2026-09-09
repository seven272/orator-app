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
  fakeBuyCourse,
} from '../controllers/courseController.js'

import aiCourseSimulatorRouter from './aiCourseSimulatorRoutes.js'

import { checkAuth } from '../middlewares/authMiddleware.js'
import { checkCourseAccess } from '../middlewares/checkCourseAccess.js'

const router = express.Router()

// Настройка multer для удержания аудио в оперативной памяти (Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Максимум 10 МБ на реплику
})

//  Получить актуальный прогресс (Внутри контроллера идет проверка, куплен ли он, поэтому checkCourseAccess сюда не вешаем)
router.get('/progress/:courseCode', checkAuth, getCourseProgress)
//  Роут покупки интенсива (Должен быть доступен ВСЕМ авторизованным пользователям)
router.post('/fake-buy', checkAuth, fakeBuyCourse)

//  Старт курса (Блок 1: создание записи UserCourseProgress), защищенный роут требует checkCourseAccess
router.post('/start', checkAuth, checkCourseAccess, startCourse)
//  Проверка ответа на квиз (Завершение Блока 1 и переход к Блоку 2)
router.post('/submit-theory', checkAuth, submitTheory)
// Сдача текстового отчета по реальной практике (Завершение Блока 3 и переход к Блоку 4)
router.post('/submit-irl', checkAuth, submitIrlReport)
// Роут для  сдачи экзамена
router.post(
  '/exam/submit',
  checkAuth,
  upload.single('audio'),
  submitExamReport,
)
// Роут для досрочного выкупа попытки за монеты (принимает { courseCode })
router.post('/exam/unlock', checkAuth, unlockExamWithCoins)
// Роут перезапуск курса
router.post('/restart', checkAuth, restartCourse)

// Получение списка пройденных курсов и симулятор ИИ
router.get('/archive', checkAuth, getUserCoursesArchive)
router.use('/simulate', checkAuth, aiCourseSimulatorRouter)

export default router
