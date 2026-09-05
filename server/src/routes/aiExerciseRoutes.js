import express from 'express'
import multer from 'multer'

import {
  checkAuth,
  checkPremium,
} from '../middlewares/authMiddleware.js'

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
router.post('/start-debate', checkAuth, checkPremium, startDebate)
router.post(
  '/response-debate',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateDebateResponse,
)
router.post('/finish-debate', checkAuth, checkPremium, finishDebate)

//роутеры упражнения Интервью
router.post(
  '/start-interview',
  checkAuth,
  checkPremium,
  startInterview,
)
router.post(
  '/response-interview',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateInterviewResponse,
)
router.post(
  '/finish-interview',
  checkAuth,
  checkPremium,
  finishInterview,
)

//роутеры упражнения Ледокол
router.post(
  '/start-icebreaker',
  checkAuth,
  checkPremium,
  startIcebreaker,
)
router.post(
  '/response-icebreaker',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateIcebreakerResponse,
)
router.post(
  '/finish-icebreaker',
  checkAuth,
  checkPremium,
  finishIcebreaker,
)

//роутеры упражнения Трибуна
router.post('/start-tribune', checkAuth, checkPremium, startTribune)
router.post(
  '/response-tribune',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responseTribune,
)
router.post('/finish-tribune', checkAuth, checkPremium, finishTribune)

//роутеры упражнения Алиби
router.post('/start-alibi', checkAuth, checkPremium, startAlibi)
router.post(
  '/response-alibi',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateAlibiResponse,
)
router.post('/finish-alibi', checkAuth, checkPremium, finishAlibi)

//роутеры упражнения Торг уместен
router.post('/start-bargain', checkAuth, checkPremium, startBargain)
router.post(
  '/response-bargain',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateBargainResponse,
)
router.post('/finish-bargain', checkAuth, checkPremium, finishBargain)

//роутеры упражнения Остроумный нокаут
router.post('/start-knockout', checkAuth, checkPremium, startKnockout)
router.post(
  '/response-knockout',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateKnockoutResponse,
)
router.post(
  '/finish-knockout',
  checkAuth,
  checkPremium,
  finishKnockout,
)

//роутеры упражнения Трудный переводчик
router.post('/start-metaphor', checkAuth, checkPremium, startMetaphor)
router.post(
  '/response-metaphor',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  generateMetaphorResponse,
)
router.post(
  '/finish-metaphor',
  checkAuth,
  checkPremium,
  finishMetaphor,
)

//роутеры упражнения Тяжелая дикиция
router.post('/start-tongue', checkAuth, checkPremium, startPoemTongue)
router.post(
  '/response-tongue',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responsePoemTongue,
)
router.post(
  '/finish-tongue',
  checkAuth,
  checkPremium,
  finishPoemTongue,
)

//роутеры упражнения Анти-слова
router.post(
  '/start-stop-word',
  checkAuth,
  checkPremium,
  startStopWord,
)
router.post(
  '/response-stop-word',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responseStopWord,
)
router.post(
  '/finish-stop-word',
  checkAuth,
  checkPremium,
  finishStopWord,
)

// Роутеры упражнения «Мастер дубляжа»
router.post('/start-acting', checkAuth, checkPremium, startPoemActing)
router.post(
  '/response-acting',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responsePoemActing,
)
router.post(
  '/finish-acting',
  checkAuth,
  checkPremium,
  finishPoemActing,
)

// Роутеры упражнения «Рэп-манифест»
router.post('/start-rap', checkAuth, checkPremium, startPoemRap)
router.post(
  '/response-rap',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responsePoemRap,
)
router.post('/finish-rap', checkAuth, checkPremium, finishPoemRap)

// Роутеры упражнения «Радиоведущий»
router.post('/start-radio', checkAuth, checkPremium, startRadioHost)
router.post(
  '/response-radio',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responseRadioHost,
)
router.post('/finish-radio', checkAuth, checkPremium, finishRadioHost)

// Роутеры упражнения Слово из шляпы
router.post(
  '/start-random-word',
  checkAuth,
  checkPremium,
  startRandomWord,
)
router.post(
  '/response-random-word',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responseRandomWord,
)
router.post(
  '/finish-random-word',
  checkAuth,
  checkPremium,
  finishRandomWord,
)

// Роутеры для нового тренажера «Эхо Истории»
router.post(
  '/start-historical',
  checkAuth,
  checkPremium,
  startHistoricalBattle,
)
router.post(
  '/response-historical',
  checkAuth,
  checkPremium,
  upload.single('audio'),
  responseHistoricalBattle,
)
router.post(
  '/finish-historical',
  checkAuth,
  checkPremium,
  finishHistoricalBattle,
)

export default router
