import express from 'express'
import multer from 'multer'

import { checkAuth } from '../middlewares/authMiddleware.js'

import {
  startDebate,
  generateDebateResponse,
  finishDebate,
} from '../controllers/ai-exercises/debateController.js'

import {
  startInterview,
  generateInterviewResponse,
  finishInterview,
} from '../controllers/ai-exercises/interviewController.js'

import {
  startIcebreaker,
  generateIcebreakerResponse,
  finishIcebreaker,
} from '../controllers/ai-exercises/icebreakerController.js'

import {
  startTribune,
  responseTribune,
  finishTribune,
} from '../controllers/ai-exercises/tribuneController.js'

import {
  startAlibi,
  generateAlibiResponse,
  finishAlibi,
} from '../controllers/ai-exercises/alibiController.js'

import {
  startBargain,
  generateBargainResponse,
  finishBargain,
} from '../controllers/ai-exercises/bargainController.js'

import {
  startKnockout,
  generateKnockoutResponse,
  finishKnockout,
} from '../controllers/ai-exercises/knockoutController.js'

import {
  startMetaphor,
  generateMetaphorResponse,
  finishMetaphor,
} from '../controllers/ai-exercises/metaphorController.js'

import {
  startPoemTongue,
  responsePoemTongue,
  finishPoemTongue,
} from '../controllers/ai-exercises/poemTongueController.js'

import {
  startStopWord,
  responseStopWord,
  finishStopWord,
} from '../controllers/ai-exercises/stopWordController.js'

import {
  startPoemActing,
  responsePoemActing,
  finishPoemActing,
} from '../controllers/ai-exercises/poemActingController.js'

import {
  startPoemRap,
  responsePoemRap,
  finishPoemRap,
} from '../controllers/ai-exercises/poemRapController.js'

import {
  startRadioHost,
  responseRadioHost,
  finishRadioHost,
} from '../controllers/ai-exercises/radioHostController.js'

import {
  startRandomWord,
  responseRandomWord,
  finishRandomWord,
} from '../controllers/ai-exercises/randomWordController.js'

import {
  startHistoricalBattle,
  responseHistoricalBattle,
  finishHistoricalBattle,
} from '../controllers/ai-exercises/historicalController.js'

const router = express.Router()

// Настройка multer для удержания аудио в оперативной памяти (Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Максимум 10 МБ на реплику
})

//роутеры упражнения Дебаты
router.post('/start-debate', checkAuth, startDebate)
router.post(
  '/response-debate',
  checkAuth,
  upload.single('audio'),
  generateDebateResponse,
)
router.post('/finish-debate', checkAuth, finishDebate)

//роутеры упражнения Интервью
router.post('/start-interview', checkAuth, startInterview)
router.post(
  '/response-interview',
  checkAuth,
  upload.single('audio'),
  generateInterviewResponse,
)
router.post('/finish-interview', checkAuth, finishInterview)

//роутеры упражнения Ледокол
router.post('/start-icebreaker', checkAuth, startIcebreaker)
router.post(
  '/response-icebreaker',
  checkAuth,
  upload.single('audio'),
  generateIcebreakerResponse,
)
router.post('/finish-icebreaker', checkAuth, finishIcebreaker)

//роутеры упражнения Трибуна
router.post('/start-tribune', checkAuth, startTribune)
router.post(
  '/response-tribune',
  checkAuth,
  upload.single('audio'),
  responseTribune,
)
router.post('/finish-tribune', checkAuth, finishTribune)

//роутеры упражнения Алиби
router.post('/start-alibi', checkAuth, startAlibi)
router.post(
  '/response-alibi',
  checkAuth,
  upload.single('audio'),
  generateAlibiResponse,
)
router.post('/finish-alibi', checkAuth, finishAlibi)

//роутеры упражнения Торг уместен
router.post('/start-bargain', checkAuth, startBargain)
router.post(
  '/response-bargain',
  checkAuth,
  upload.single('audio'),
  generateBargainResponse,
)
router.post('/finish-bargain', checkAuth, finishBargain)

//роутеры упражнения Остроумный нокаут
router.post('/start-knockout', checkAuth, startKnockout)
router.post(
  '/response-knockout',
  checkAuth,
  upload.single('audio'),
  generateKnockoutResponse,
)
router.post('/finish-knockout', checkAuth, finishKnockout)

//роутеры упражнения Трудный переводчик
router.post('/start-metaphor', checkAuth, startMetaphor)
router.post(
  '/response-metaphor',
  checkAuth,
  upload.single('audio'),
  generateMetaphorResponse,
)
router.post('/finish-metaphor', checkAuth, finishMetaphor)

//роутеры упражнения Тяжелая дикиция
router.post('/start-tongue', checkAuth, startPoemTongue)
router.post(
  '/response-tongue',
  checkAuth,
  upload.single('audio'),
  responsePoemTongue,
)
router.post('/finish-tongue', checkAuth, finishPoemTongue)

//роутеры упражнения Анти-слова
router.post('/start-stop-word', checkAuth, startStopWord)
router.post(
  '/response-stop-word',
  checkAuth,
  upload.single('audio'),
  responseStopWord,
)
router.post('/finish-stop-word', checkAuth, finishStopWord)

// Роутеры упражнения «Мастер дубляжа»
router.post('/start-acting', checkAuth, startPoemActing)
router.post(
  '/response-acting',
  checkAuth,
  upload.single('audio'),
  responsePoemActing,
)
router.post('/finish-acting', checkAuth, finishPoemActing)

// Роутеры упражнения «Рэп-манифест»
router.post('/start-rap', checkAuth, startPoemRap)
router.post(
  '/response-rap',
  checkAuth,
  upload.single('audio'),
  responsePoemRap,
)
router.post('/finish-rap', checkAuth, finishPoemRap)

// Роутеры упражнения «Радиоведущий»
router.post('/start-radio', checkAuth, startRadioHost)
router.post(
  '/response-radio',
  checkAuth,
  upload.single('audio'),
  responseRadioHost,
)
router.post('/finish-radio', checkAuth, finishRadioHost)

// Роутеры упражнения Слово из шляпы
router.post('/start-random-word', checkAuth, startRandomWord)
router.post(
  '/response-random-word',
  checkAuth,
  upload.single('audio'),
  responseRandomWord,
)
router.post('/finish-random-word', checkAuth, finishRandomWord)

// Роутеры для нового тренажера «Эхо Истории»
router.post('/start-historical', checkAuth, startHistoricalBattle)
router.post(
  '/response-historical',
  checkAuth,
  upload.single('audio'),
  responseHistoricalBattle,
)
router.post('/finish-historical', checkAuth, finishHistoricalBattle)

export default router
