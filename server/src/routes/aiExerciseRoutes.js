import express from 'express'
import multer from 'multer'

import { checkAuth } from '../middlewares/authMiddleware.js'

import {
  checkPremiumAndTicket,
  checkActiveSessionGuard,
} from '../middlewares/exerciseMiddleware.js'

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

//роутеры упражнения Дебаты ai-debate
router.post(
  '/start-debate',
  checkAuth,
  checkPremiumAndTicket('ai-debate'),
  startDebate,
)
router.post(
  '/response-debate',
  checkAuth,
  checkActiveSessionGuard('ai-debate'),
  upload.single('audio'),
  generateDebateResponse,
)
router.post(
  '/finish-debate',
  checkAuth,
  checkActiveSessionGuard('ai-debate'),
  finishDebate,
)

//роутеры упражнения Интервью ai-inrerview
router.post(
  '/start-interview',
  checkAuth,
  checkPremiumAndTicket('ai-inrerview'),
  startInterview,
)
router.post(
  '/response-interview',
  checkAuth,
  checkActiveSessionGuard('ai-inrerview'),
  upload.single('audio'),
  generateInterviewResponse,
)
router.post(
  '/finish-interview',
  checkAuth,
  checkActiveSessionGuard('ai-inrerview'),
  finishInterview,
)

//роутеры упражнения Ледокол ai-icebreaker
router.post(
  '/start-icebreaker',
  checkAuth,
  checkPremiumAndTicket('ai-icebreaker'),
  startIcebreaker,
)
router.post(
  '/response-icebreaker',
  checkAuth,
  checkActiveSessionGuard('ai-icebreaker'),
  upload.single('audio'),
  generateIcebreakerResponse,
)
router.post(
  '/finish-icebreaker',
  checkAuth,
  checkActiveSessionGuard('ai-icebreaker'),
  finishIcebreaker,
)

//роутеры упражнения Трибуна ai-tribune
router.post(
  '/start-tribune',
  checkAuth,
  checkPremiumAndTicket('ai-tribune'),
  startTribune,
)
router.post(
  '/response-tribune',
  checkAuth,
  checkActiveSessionGuard('ai-tribune'),
  upload.single('audio'),
  responseTribune,
)
router.post(
  '/finish-tribune',
  checkAuth,
  checkActiveSessionGuard('ai-tribune'),
  finishTribune,
)

//роутеры упражнения Алиби ai-alibi
router.post(
  '/start-alibi',
  checkAuth,
  checkPremiumAndTicket('ai-alibi'),
  startAlibi,
)
router.post(
  '/response-alibi',
  checkAuth,
  checkActiveSessionGuard('ai-alibi'),
  upload.single('audio'),
  generateAlibiResponse,
)
router.post(
  '/finish-alibi',
  checkAuth,
  checkActiveSessionGuard('ai-alibi'),
  finishAlibi,
)

//роутеры упражнения Торг уместен ai-bargain
router.post(
  '/start-bargain',
  checkAuth,
  checkPremiumAndTicket('ai-bargain'),
  startBargain,
)
router.post(
  '/response-bargain',
  checkAuth,
  checkActiveSessionGuard('ai-bargain'),
  upload.single('audio'),
  generateBargainResponse,
)
router.post(
  '/finish-bargain',
  checkAuth,
  checkActiveSessionGuard('ai-bargain'),
  finishBargain,
)

//роутеры упражнения Остроумный нокаут ai-knockout
router.post(
  '/start-knockout',
  checkAuth,
  checkPremiumAndTicket('ai-knockout'),
  startKnockout,
)
router.post(
  '/response-knockout',
  checkAuth,
  checkActiveSessionGuard('ai-knockout'),
  upload.single('audio'),
  generateKnockoutResponse,
)
router.post(
  '/finish-knockout',
  checkAuth,
  checkActiveSessionGuard('ai-knockout'),
  finishKnockout,
)

//роутеры упражнения Трудный переводчик ai-metaphor
router.post(
  '/start-metaphor',
  checkAuth,
  checkPremiumAndTicket('ai-metaphor'),
  startMetaphor,
)
router.post(
  '/response-metaphor',
  checkAuth,
  checkActiveSessionGuard('ai-metaphor'),
  upload.single('audio'),
  generateMetaphorResponse,
)
router.post(
  '/finish-metaphor',
  checkAuth,
  checkActiveSessionGuard('ai-metaphor'),
  finishMetaphor,
)

//роутеры упражнения Тяжелая дикиция ai-poem-tongue
router.post(
  '/start-tongue',
  checkAuth,
  checkPremiumAndTicket('ai-poem-tongue'),
  startPoemTongue,
)
router.post(
  '/response-tongue',
  checkAuth,
  checkActiveSessionGuard('ai-poem-tongue'),
  upload.single('audio'),
  responsePoemTongue,
)
router.post(
  '/finish-tongue',
  checkAuth,
  checkActiveSessionGuard('ai-poem-tongue'),
  finishPoemTongue,
)

// Роутеры упражнения «Мастер дубляжа» ai-poem-rap
router.post(
  '/start-acting',
  checkAuth,
  checkPremiumAndTicket('ai-poem-acting'),
  startPoemActing,
)
router.post(
  '/response-acting',
  checkAuth,
  checkActiveSessionGuard('ai-poem-acting'),
  upload.single('audio'),
  responsePoemActing,
)
router.post(
  '/finish-acting',
  checkAuth,
  checkActiveSessionGuard('ai-poem-acting'),
  finishPoemActing,
)

// Роутеры упражнения «Рэп-манифест» ai-poem-rap
router.post(
  '/start-rap',
  checkAuth,
  checkPremiumAndTicket('ai-poem-rap'),
  startPoemRap,
)
router.post(
  '/response-rap',
  checkAuth,
  checkActiveSessionGuard('ai-poem-rap'),
  upload.single('audio'),
  responsePoemRap,
)
router.post(
  '/finish-rap',
  checkAuth,
  checkActiveSessionGuard('ai-poem-rap'),
  finishPoemRap,
)

// Роутеры упражнения «Радиоведущий» ai-radio-host
router.post(
  '/start-radio',
  checkAuth,
  checkPremiumAndTicket('ai-radio-host'),
  startRadioHost,
)
router.post(
  '/response-radio',
  checkAuth,
  checkActiveSessionGuard('ai-radio-host'),
  upload.single('audio'),
  responseRadioHost,
)
router.post(
  '/finish-radio',
  checkAuth,
  checkActiveSessionGuard('ai-radio-host'),
  finishRadioHost,
)

//роутеры упражнения Анти-слова ai-stop-word
router.post(
  '/start-stop-word',
  checkAuth,
  checkPremiumAndTicket('ai-stop-word'),
  startStopWord,
)
router.post(
  '/response-stop-word',
  checkAuth,
  checkActiveSessionGuard('ai-stop-word'),
  upload.single('audio'),
  responseStopWord,
)
router.post(
  '/finish-stop-word',
  checkAuth,
  checkActiveSessionGuard('ai-stop-word'),
  finishStopWord,
)

// Роутеры упражнения Слово из шляпы ai-random-word
router.post(
  '/start-random-word',
  checkAuth,
  checkPremiumAndTicket('ai-random-word'),
  startRandomWord,
)
router.post(
  '/response-random-word',
  checkAuth,
  checkActiveSessionGuard('ai-random-word'),
  upload.single('audio'),
  responseRandomWord,
)
router.post(
  '/finish-random-word',
  checkAuth,
  checkActiveSessionGuard('ai-random-word'),
  finishRandomWord,
)

// Роутеры для нового тренажера «Эхо Истории» ai-historical-battle
router.post(
  '/start-historical',
  checkAuth,
  checkPremiumAndTicket('ai-historical-battle'),
  startHistoricalBattle,
)
router.post(
  '/response-historical',
  checkAuth,
  checkActiveSessionGuard('ai-historical-battle'),
  upload.single('audio'),
  responseHistoricalBattle,
)
router.post(
  '/finish-historical',
  checkAuth,
  checkActiveSessionGuard('ai-historical-battle'),
  finishHistoricalBattle,
)

export default router
