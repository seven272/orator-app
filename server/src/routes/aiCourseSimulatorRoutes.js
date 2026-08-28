import express from 'express'
import multer from 'multer'
import { checkAuth } from '../middlewares/authMiddleware.js'

import {
  startPitchTrainer,
  generatePitchResponse,
  finishPitchTrainer,
} from '../controllers/ai-courses-simulators/pitch-master/pitch/pitchController.js'

import {
  finishObjectionTrainer,
  generateObjectionResponse,
  startObjectionTrainer,
} from '../controllers/ai-courses-simulators/pitch-master/objection/objectionController.js'

import {
  startVipCloseTrainer,
  generateVipCloseResponse,
  finishVipCloseTrainer,
} from '../controllers/ai-courses-simulators/self-pitch-pro/vip-client-close/vipClientCloseController.js'

import {
  startNetworkingTrainer,
  generateNetworkingResponse,
  finishNetworkingTrainer,
} from '../controllers/ai-courses-simulators/self-pitch-pro/networking-expert/networkingExpertController.js'

import {
  startHrScreenerTrainer,
  generateHrScreenerResponse,
  finishHrScreenerTrainer,
} from '../controllers/ai-courses-simulators/hr-storm/hr-screener/hrScreenerController.js'

import {
  startStressInterviewTrainer,
  generateStressResponse,
  finishStressInterviewTrainer,
} from '../controllers/ai-courses-simulators/hr-storm/stress-interview/stressInterviewController.js'

import {
  startBarSmallTalkTrainer,
  generateBarSmallTalkResponse,
  finishBarSmallTalkTrainer,
} from '../controllers/ai-courses-simulators/party-charisma/bar-small-talk/barSmallTalkController.js'

import {
  startVipAfterpartyTrainer,
  generateVipAfterpartyResponse,
  finishVipAfterpartyTrainer,
} from '../controllers/ai-courses-simulators/party-charisma/vip-afterparty/vipAfterpartyController.js'

import {
  startToxicRelativeTrainer,
  generateToxicRelativeResponse,
  finishToxicRelativeTrainer,
} from '../controllers/ai-courses-simulators/social-shield/toxic-relative/toxicRelativeController.js'

import {
  startStreetRudenessTrainer,
  generateStreetRudenessResponse,
  finishStreetRudenessTrainer,
} from '../controllers/ai-courses-simulators/social-shield/street-rudeness/streetRudenessController.js'

import {
  startTrollHandlerTrainer,
  generateTrollResponse,
  finishTrollHandlerTrainer,
} from '../controllers/ai-courses-simulators/media-speaker/troll-handler/trollHandlerController.js'

import {
  startTimeLimitPitchTrainer,
  generateTimeLimitResponse,
  finishTimeLimitPitchTrainer,
} from '../controllers/ai-courses-simulators/media-speaker/time-limit-pitch/timeLimitPitchController.js'

import {
  startImpromptuToastTrainer,
  generateImpromptuResponse,
  finishImpromptuToastTrainer,
} from '../controllers/ai-courses-simulators/toast-master/impromptu-toast/impromptuToastController.js'

import {
  startWeddingChallengeTrainer,
  generateWeddingResponse,
  finishWeddingChallengeTrainer,
} from '../controllers/ai-courses-simulators/toast-master/wedding-challenge/weddingChallengeController.js'

import {
  startHeroJourneyTrainer,
  generateHeroJourneyResponse,
  finishHeroJourneyTrainer,
} from '../controllers/ai-courses-simulators/story-master/hero-journey/heroJourneyController.js'

import {
  startFiascoTurnTrainer,
  generateFiascoTurnResponse,
  finishFiascoTurnTrainer,
} from '../controllers/ai-courses-simulators/story-master/fiasco-turn/fiascoTurnController.js'

import {
  startEmpathySparkTrainer,
  generateEmpathySparkResponse,
  finishEmpathySparkTrainer,
} from '../controllers/ai-courses-simulators/compliment-pro/empathy-spark/empathySparkController.js'

import {
  startAntiFlatteryTrainer,
  generateAntiFlatteryResponse,
  finishAntiFlatteryTrainer,
} from '../controllers/ai-courses-simulators/compliment-pro/anti-flattery/antiFlatteryController.js'

import {
  startTaxiBlitzTrainer,
  generateTaxiBlitzResponse,
  finishTaxiBlitzTrainer,
} from '../controllers/ai-courses-simulators/qa-master/taxi-blitz/taxiBlitzController.js'

// Импорт контроллеров тренажера «Семейное минное поле» (family-minefield)
import {
  startFamilyMinefieldTrainer,
  generateFamilyMinefieldResponse,
  finishFamilyMinefieldTrainer,
} from '../controllers/ai-courses-simulators/qa-master/family-minefield/familyMinefieldController.js'

// Импорт контроллеров тренажера «Винтажный раритет» (vintage-scout)
import {
  startVintageScoutTrainer,
  generateVintageScoutResponse,
  finishVintageScoutTrainer,
} from '../controllers/ai-courses-simulators/question-architect/vintage-scout/vintageScoutController.js'

// Импорт контроллеров тренажера «Попутчик-Глухарь» (deaf-passenger)
import {
  startDeafPassengerTrainer,
  generateDeafPassengerResponse,
  finishDeafPassengerTrainer,
} from '../controllers/ai-courses-simulators/question-architect/deaf-passenger/deafPassengerController.js'

const aiCourseSimulatorRouter = express.Router()

// Настройка multer для аудио
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

/* ==========================================================================
   🎯 КУРС "ПИТЧ НА МИЛЛИОН" (pitch_master),
   ========================================================================== */

// тренажер Питч с Инвестором
aiCourseSimulatorRouter.post(
  '/pitch-master/pitch/start',
  checkAuth,
  startPitchTrainer,
)
aiCourseSimulatorRouter.post(
  '/pitch-master/pitch/respond',
  checkAuth,
  upload.single('file'),
  generatePitchResponse,
)
aiCourseSimulatorRouter.post(
  '/pitch-master/pitch/finish',
  checkAuth,
  finishPitchTrainer,
)

// тренажер Обработка возвражений
aiCourseSimulatorRouter.post(
  '/pitch-master/objection/start',
  checkAuth,
  startObjectionTrainer,
)
aiCourseSimulatorRouter.post(
  '/pitch-master/objection/respond',
  checkAuth,
  upload.single('file'),
  generateObjectionResponse,
)
aiCourseSimulatorRouter.post(
  '/pitch-master/objection/finish',
  checkAuth,
  finishObjectionTrainer,
)

/* ==========================================================================
   🤝 Курс Личный бренд: Самопрезентация на миллион
   ========================================================================== */
// тренажер Встреча на миллион: Закрытие VIP-клиента
aiCourseSimulatorRouter.post(
  '/self-pitch-pro/vip-client-close/start',
  checkAuth,
  startVipCloseTrainer,
)

aiCourseSimulatorRouter.post(
  '/self-pitch-pro/vip-client-close/respond',
  checkAuth,
  upload.single('file'),
  generateVipCloseResponse,
)

aiCourseSimulatorRouter.post(
  '/self-pitch-pro/vip-client-close/finish',
  checkAuth,
  finishVipCloseTrainer,
)

// --- ТРЕНАЖЕР 2: Нетворкинг-мастер: Бизнес-знакомство ---
aiCourseSimulatorRouter.post(
  '/self-pitch-pro/networking-expert/start',
  checkAuth,
  startNetworkingTrainer,
)

aiCourseSimulatorRouter.post(
  '/self-pitch-pro/networking-expert/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи
  generateNetworkingResponse,
)

aiCourseSimulatorRouter.post(
  '/self-pitch-pro/networking-expert/finish',
  checkAuth,
  finishNetworkingTrainer,
)
// Тренажер первичное собеседование
aiCourseSimulatorRouter.post(
  '/hr-storm/hr-screener/start',
  checkAuth,
  startHrScreenerTrainer,
)

aiCourseSimulatorRouter.post(
  '/hr-storm/hr-screener/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиофайла через thunk-ключ 'file'
  generateHrScreenerResponse,
)
aiCourseSimulatorRouter.post(
  '/hr-storm/hr-screener/finish',
  checkAuth,
  finishHrScreenerTrainer,
)

// Стресс-интервью с будущим боссом
aiCourseSimulatorRouter.post(
  '/hr-storm/stress-interview/start',
  checkAuth,
  startStressInterviewTrainer,
)

aiCourseSimulatorRouter.post(
  '/hr-storm/stress-interview/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиофайла через thunk-ключ 'file'
  generateStressResponse,
)

aiCourseSimulatorRouter.post(
  '/hr-storm/stress-interview/finish',
  checkAuth,
  finishStressInterviewTrainer,
)

/* ==========================================================================
   🥂 КУРС: Харизма нетворкинга: Свой в любой компании (party_charisma)
   ========================================================================== */
// --- ТРЕНАЖЕР 1: Разговор у барной стойки (bar_small_talk) ---
aiCourseSimulatorRouter.post(
  '/party-charisma/bar-small-talk/start',
  checkAuth,
  startBarSmallTalkTrainer,
)

aiCourseSimulatorRouter.post(
  '/party-charisma/bar-small-talk/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи через thunk-ключ 'file'
  generateBarSmallTalkResponse,
)
aiCourseSimulatorRouter.post(
  '/party-charisma/bar-small-talk/finish',
  checkAuth,
  finishBarSmallTalkTrainer,
)

// --- ТРЕНАЖЕР Закрытое афтерпати лидеров (vip_afterparty) ---
aiCourseSimulatorRouter.post(
  '/party-charisma/vip-afterparty/start',
  checkAuth,
  startVipAfterpartyTrainer,
)
aiCourseSimulatorRouter.post(
  '/party-charisma/vip-afterparty/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи через thunk-ключ 'file'
  generateVipAfterpartyResponse,
)
aiCourseSimulatorRouter.post(
  '/party-charisma/vip-afterparty/finish',
  checkAuth,
  finishVipAfterpartyTrainer,
)

// Инициализация сессии и старт тренажера манипуляций
aiCourseSimulatorRouter.post(
  '/social-shield/toxic-relative/start',
  checkAuth,
  startToxicRelativeTrainer,
)
aiCourseSimulatorRouter.post(
  '/social-shield/toxic-relative/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи из thunk-ключа 'file'
  generateToxicRelativeResponse,
)
aiCourseSimulatorRouter.post(
  '/social-shield/toxic-relative/finish',
  checkAuth,
  finishToxicRelativeTrainer,
)

// Тренажер хамстов
aiCourseSimulatorRouter.post(
  '/social-shield/street-rudeness/start',
  checkAuth,
  startStreetRudenessTrainer,
)
aiCourseSimulatorRouter.post(
  '/social-shield/street-rudeness/respond',
  checkAuth,
  upload.single('file'),
  generateStreetRudenessResponse,
)
aiCourseSimulatorRouter.post(
  '/social-shield/street-rudeness/finish',
  checkAuth,
  finishStreetRudenessTrainer,
)

// --- ТРЕНАЖЕР  Отражение троллинга из зала ---
aiCourseSimulatorRouter.post(
  '/media-speaker/troll-handler/start',
  checkAuth,
  startTrollHandlerTrainer,
)

aiCourseSimulatorRouter.post(
  '/media-speaker/troll-handler/respond',
  checkAuth,
  upload.single('file'),
  generateTrollResponse,
)

aiCourseSimulatorRouter.post(
  '/media-speaker/troll-handler/finish',
  checkAuth,
  finishTrollHandlerTrainer,
)

// --- ТРЕНАЖЕР Спич в условиях цейтнота ---

aiCourseSimulatorRouter.post(
  '/media-speaker/time-limit-pitch/start',
  checkAuth,
  startTimeLimitPitchTrainer,
)

aiCourseSimulatorRouter.post(
  '/media-speaker/time-limit-pitch/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи через thunk-ключ 'file'
  generateTimeLimitResponse,
)

aiCourseSimulatorRouter.post(
  '/media-speaker/time-limit-pitch/finish',
  checkAuth,
  finishTimeLimitPitchTrainer,
)

// --- ТРЕНАЖЕР Внезапное слово на корпоративе ---
aiCourseSimulatorRouter.post(
  '/toast-master/impromptu-toast/start',
  checkAuth,
  startImpromptuToastTrainer,
)

aiCourseSimulatorRouter.post(
  '/toast-master/impromptu-toast/respond',
  checkAuth,
  upload.single('file'),
  generateImpromptuResponse,
)

aiCourseSimulatorRouter.post(
  '/toast-master/impromptu-toast/finish',
  checkAuth,
  finishImpromptuToastTrainer,
)

// --- ТРЕНАЖЕР Свадебный тост / Юбилей ---
aiCourseSimulatorRouter.post(
  '/toast-master/wedding-challenge/start',
  checkAuth,
  startWeddingChallengeTrainer,
)
aiCourseSimulatorRouter.post(
  '/toast-master/wedding-challenge/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи через thunk-ключ 'file'
  generateWeddingResponse,
)
aiCourseSimulatorRouter.post(
  '/toast-master/wedding-challenge/finish',
  checkAuth,
  finishWeddingChallengeTrainer,
)
// --- ТРЕНАЖЕР  Путь героя (hero_journey) ---
aiCourseSimulatorRouter.post(
  '/story-master/hero-journey/start',
  checkAuth,
  startHeroJourneyTrainer,
)
aiCourseSimulatorRouter.post(
  '/story-master/hero-journey/respond',
  checkAuth,
  upload.single('file'), // Перехват аудиозаписи от фронтенда через thunk-ключ 'file'
  generateHeroJourneyResponse,
)
aiCourseSimulatorRouter.post(
  '/story-master/hero-journey/finish',
  checkAuth,
  finishHeroJourneyTrainer,
)

// --- ТРЕНАЖЕР  Из провала в триумф (fiasco_turn) ---
aiCourseSimulatorRouter.post(
  '/story-master/fiasco-turn/start',
  checkAuth,
  startFiascoTurnTrainer,
)
aiCourseSimulatorRouter.post(
  '/story-master/fiasco-turn/respond',
  checkAuth,
  upload.single('file'),
  generateFiascoTurnResponse,
)
aiCourseSimulatorRouter.post(
  '/story-master/fiasco-turn/finish',
  checkAuth,
  finishFiascoTurnTrainer,
)

// Тренажер Искра доверия (empathy_spark)
aiCourseSimulatorRouter.post(
  '/compliment-pro/empathy-spark/start',
  checkAuth,
  startEmpathySparkTrainer,
)
aiCourseSimulatorRouter.post(
  '/compliment-pro/empathy-spark/respond',
  checkAuth,
  upload.single('file'),
  generateEmpathySparkResponse,
)
aiCourseSimulatorRouter.post(
  '/compliment-pro/empathy-spark/finish',
  checkAuth,
  finishEmpathySparkTrainer,
)

// Тренажер  Тонкая грань (anti_flattery)
aiCourseSimulatorRouter.post(
  '/compliment-pro/anti-flattery/start',
  checkAuth,
  startAntiFlatteryTrainer,
)
aiCourseSimulatorRouter.post(
  '/compliment-pro/anti-flattery/respond',
  checkAuth,
  upload.single('file'),
  generateAntiFlatteryResponse,
)
aiCourseSimulatorRouter.post(
  '/compliment-pro/anti-flattery/finish',
  checkAuth,
  finishAntiFlatteryTrainer,
)

// --- Тренажер Такси-Блиц (taxi_blitz) ---
aiCourseSimulatorRouter.post(
  '/qa-master/taxi-blitz/start',
  checkAuth,
  startTaxiBlitzTrainer,
)
aiCourseSimulatorRouter.post(
  '/qa-master/taxi-blitz/respond',
  checkAuth,
  upload.single('file'),
  generateTaxiBlitzResponse,
)
aiCourseSimulatorRouter.post(
  '/qa-master/taxi-blitz/finish',
  checkAuth,
  finishTaxiBlitzTrainer,
)

// --- Тренажер Семейное минное поле (family_minefield) ---
aiCourseSimulatorRouter.post(
  '/qa-master/family-minefield/start',
  checkAuth,
  startFamilyMinefieldTrainer,
)
aiCourseSimulatorRouter.post(
  '/qa-master/family-minefield/respond',
  checkAuth,
  upload.single('file'),
  generateFamilyMinefieldResponse,
)
aiCourseSimulatorRouter.post(
  '/qa-master/family-minefield/finish',
  checkAuth,
  finishFamilyMinefieldTrainer,
)
// --- Тренажер: Винтажный раритет (vintage_scout) ---
aiCourseSimulatorRouter.post(
  '/question-architect/vintage-scout/start',
  checkAuth,
  startVintageScoutTrainer,
)
aiCourseSimulatorRouter.post(
  '/question-architect/vintage-scout/respond',
  checkAuth,
  upload.single('file'),
  generateVintageScoutResponse,
)
aiCourseSimulatorRouter.post(
  '/question-architect/vintage-scout/finish',
  checkAuth,
  finishVintageScoutTrainer,
)

// --- Тренажер Попутчик-Глухарь (deaf_passenger) ---
aiCourseSimulatorRouter.post(
  '/question-architect/deaf-passenger/start',
  checkAuth,
  startDeafPassengerTrainer,
)
aiCourseSimulatorRouter.post(
  '/question-architect/deaf-passenger/respond',
  checkAuth,
  upload.single('file'),
  generateDeafPassengerResponse,
)
aiCourseSimulatorRouter.post(
  '/question-architect/deaf-passenger/finish',
  checkAuth,
  finishDeafPassengerTrainer,
)

export default aiCourseSimulatorRouter
