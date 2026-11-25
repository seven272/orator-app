import User from '../models/User.js'
import RankExamSession from '../models/RankExamSession.js'
import { RANK_EXAMS_CONFIG } from '../assets/prompts/rankExamPrompts.js'
import { calculateSpeakerProgress } from '../utils/rankService.js'
import { sendGigaChatRequest } from '../utils/gigachatService.js'
import { parseAiResponse } from '../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../utils/speechService.js'

/**
 * POST /api/rank/exam/start
 * Проверка разблокировки ранга и выдача случайного билета (без записи в БД)
 */
const startRankExam = async (req, res) => {
  try {
    const userId = req.userId
    const { alias } = req.body

    const examConfig = RANK_EXAMS_CONFIG[alias]
    if (!examConfig) {
      return res.status(400).json({ message: 'Неизвестный тип экзамена' })
    }

    const user = await User.findById(userId).select('progression stats')
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const progress = calculateSpeakerProgress(user)
    if (
      progress.isMaxRank ||
      progress.nextRank?.rankIndex !== examConfig.targetRank ||
      !progress.requirements?.exam?.isUnlocked
    ) {
      return res.status(403).json({
        message:
          'Экзамен заблокирован. Сначала наберите нужный XP и пороговые баллы в целевых ИИ-тренажерах.',
      })
    }

    const ticketsPool = examConfig.tickets
    const randomIndex = Math.floor(Math.random() * ticketsPool.length)
    const ticketData = ticketsPool[randomIndex]

    const preview = `Экзаменационный билет получен. Тема: «${ticketData.topic}». ${ticketData.context} Задача: ${ticketData.task} Внимательно изучите условия и начинайте запись, когда будете готовы.`

    return res.status(200).json({
      examMeta: {
        alias: examConfig.alias,
        title: examConfig.title,
        subtitle: examConfig.subtitle,
        timeLimit: examConfig.timeLimit,
        minScore: examConfig.minScore,
        criteriaLabels: examConfig.criteriaLabels,
      },
      ticketData,
      preview,
    })
  } catch (error) {
    console.error('Ошибка в startRankExam:', error)
    return res.status(500).json({
      message: 'Ошибка сервера при подготовке экзамена',
      error: error.message,
    })
  }
}

/**
 * POST /api/rank/exam/response
 * Прием аудио (SalutSpeech) или текста монолога пользователя (без записи в БД)
 */
const responseRankExam = async (req, res) => {
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка распознавания SalutSpeech на экзамене:', speechError)
        return res.status(500).json({
          message: 'Не удалось распознать аудиозапись. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    if (!userMessage || !userMessage.trim()) {
      return res.status(200).json({
        user_transcript: '',
        answer: 'Вы ничего не сказали. Оценить пустую речь невозможно.',
        isFinished: true,
        isError: true,
      })
    }

    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer: 'Выступление принято. Нажмите «Вердикт ИИ-судьи», чтобы получить оценку экзаменатора.',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Ошибка в responseRankExam:', error)
    return res.status(500).json({
      message: 'Ошибка сервера при обработке ответа на экзамене',
      error: error.message,
    })
  }
}

/**
 * POST /api/rank/exam/finish
 * Оценка монолога ИИ-судьей. В БД сохраняются ТОЛЬКО успешно сданные экзамены (> 80 баллов)
 */
const finishRankExam = async (req, res) => {
  try {
    const userId = req.userId
    const { alias, ticketId, userSpeech } = req.body

    const examConfig = RANK_EXAMS_CONFIG[alias]
    if (!examConfig) {
      return res.status(400).json({ message: 'Неизвестный тип экзамена' })
    }

    const ticketData =
      examConfig.tickets.find((t) => t.id === ticketId) || examConfig.tickets[0]

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const defaultCriteriaKeys = Object.keys(examConfig.criteriaLabels)
    const zeroCriteria = Object.fromEntries(defaultCriteriaKeys.map((k) => [k, 0]))

    // Если пользователь промолчал — не пишем в БД, сразу возвращаем результат
    if (!userSpeech || !userSpeech.trim()) {
      return res.status(200).json({
        passed: false,
        minScore: examConfig.minScore,
        session: {
          result: {
            totalScore: 0,
            feedback: 'Речь не была произнесена. Экзамен не сдан.',
            criteria: zeroCriteria,
          },
        },
        speakerProgress: calculateSpeakerProgress(user),
      })
    }

    const judgePrompt = examConfig.buildJudgePrompt(ticketData)
    let evaluation = null

    try {
      const aiJsonResult = await sendGigaChatRequest(
        [
          { role: 'system', content: judgePrompt },
          { role: 'user', content: userSpeech.trim() },
        ],
        800,
        0.2,
      )

      const fallbackCriteria = Object.fromEntries(defaultCriteriaKeys.map((k) => [k, 50]))
      evaluation = parseAiResponse(aiJsonResult, fallbackCriteria)
    } catch (apiError) {
      console.error('Сбой сети GigaChat при судействе экзамена:', apiError.message)
    }

    if (!evaluation || typeof evaluation.totalScore !== 'number') {
      const fallbackCriteria = Object.fromEntries(defaultCriteriaKeys.map((k) => [k, 50]))
      evaluation = {
        totalScore: 50,
        feedback:
          'Нейросеть временно перегружена и не смогла провести глубокий разбор. Попробуйте пересдать экзамен.',
        criteria: fallbackCriteria,
      }
    }

    const isPassed = evaluation.totalScore > examConfig.minScore
    const resultPayload = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    let savedSession = { result: resultPayload }

    // Сохраняем в БД ТОЛЬКО при успешной сдаче (> 80 баллов)
    if (isPassed) {
      savedSession = await RankExamSession.create({
        userId,
        examAlias: alias,
        targetRank: examConfig.targetRank,
        ticketData,
        userSpeech: userSpeech.trim(),
        score: evaluation.totalScore,
        passed: true,
        status: 'completed',
        result: resultPayload,
      })

      const challengeIndex = user.progression.rankChallenges.findIndex(
        (c) => c.targetRank === examConfig.targetRank,
      )

      if (challengeIndex === -1) {
        user.progression.rankChallenges.push({
          targetRank: examConfig.targetRank,
          examPassed: true,
          examBestScore: evaluation.totalScore,
          completedAt: new Date(),
        })
      } else {
        const record = user.progression.rankChallenges[challengeIndex]
        if (evaluation.totalScore > (record.examBestScore || 0)) {
          record.examBestScore = evaluation.totalScore
        }
        if (!record.examPassed) {
          record.examPassed = true
          record.completedAt = new Date()
        }
      }

      await user.save()
    }

    return res.status(200).json({
      passed: isPassed,
      minScore: examConfig.minScore,
      session: savedSession,
      speakerProgress: calculateSpeakerProgress(user),
    })
  } catch (error) {
    console.error('Ошибка в finishRankExam:', error)
    return res.status(500).json({ message: 'Ошибка анализа экзаменационной речи' })
  }
}

export { startRankExam, responseRankExam, finishRankExam }
