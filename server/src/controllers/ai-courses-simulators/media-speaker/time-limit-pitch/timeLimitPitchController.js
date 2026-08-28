// ai-courses-simulators/media-speaker/time-limit-pitch/timeLimitPitchController.js

import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import { getTimeLimitPitchDialogPrompt, TIME_LIMIT_PITCH_EVALUATION_PROMPT } from './timeLimitPitchPrompt.js'

/**
 * 1. СТАРТ ТРЕНАЖЕРА (Инициализация блиц-защиты)
 */
const startTimeLimitPitchTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode, exerciseData } = req.body

    const progress = await UserCourseProgress.findOne({ userId, courseCode })
    if (!progress) {
      return res.status(404).json({ message: 'Прогресс по данному интенсиву не найден' })
    }

    if (progress.currentBlockIndex !== 1) {
      return res.status(400).json({ message: 'Вы не можете пройти ИИ-тренажер на текущем этапе курса' })
    }

    const preview = `Заседание началось. Перед вами: ${exerciseData.role}. Обстановка: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем структуру сессии под ключ time_limit_pitch
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'time_limit_pitch',
      exerciseData,
      messages: [],
      createdAt: new Date(),
    }

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(201).json({ preview, question, progressData: progress })
  } catch (error) {
    console.error('Error in startTimeLimitPitchTrainer:', error)
    res.status(500).json({ message: 'Ошибка сервера при старте тренажера цейтнота', error: error.message })
  }
}

/**
 * 2. ХОД СЕССИИ (Прием аудио, транскрипция, резкое перебивание члена комитета)
 */
const generateTimeLimitResponse = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body
    let userMessage = null

    const progress = await UserCourseProgress.findOne({ userId, courseCode })
    if (!progress || !progress.blocksProgress?.aiWorkout?.currentSession) {
      return res.status(400).json({ message: 'Активная сессия тренажера не найдена. Начните сначала.' })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (session.status !== 'active' || session.workoutConfigId !== 'time_limit_pitch') {
      return res.status(400).json({ message: 'Эта сессия уже завершена или некорректна.' })
    }

    const { role, topic, context } = session.exerciseData

    if (req.file) {
      try {
        console.log('--- ДАННЫЕ ИЗ REQ.FILE (MULTER) ---')
        console.log('Имя поля (fieldname):', req.file.fieldname)
        console.log('MIME-тип от фронта (mimetype):', req.file.mimetype)
        console.log('-----------------------------------')
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка Yandex SpeechKit в тренажере цейтнота:', speechError)
        return res.status(500).json({
          message: 'Не удалось распознать вашу речь комитетом. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    } else {
      return res.status(400).json({ message: 'Аудиофайл ответа не был передан.' })
    }

    const attemptsCount = session.messages.filter((m) => m.role === 'user').length
    const isSessionFinished = attemptsCount >= 2 // Конец защиты после 3-го ответа спикера (0, 1, 2)

    if (!userMessage || !userMessage.trim()) {
      session.messages.push({ role: 'user', text: 'Пользователь промолчал' })

      progress.markModified('blocksProgress.aiWorkout.currentSession.messages')
      progress.markModified('blocksProgress.aiWorkout.currentSession')
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer: 'Вы промолчали. Член совета стучит ручкой по столу: «Время идет, ближе к делу!»',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getTimeLimitPitchDialogPrompt(role, topic, context, cleanUserMessage)

    const response = await gigachatAxiosClient.post('/chat/completions', {
      model: 'GigaChat-2',
      messages: [{ role: 'user', content: PROMPT }],
      max_tokens: 300,
    })

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer) throw new Error('Пустой ответ от GigaChat в тренажере цейтнота')

    session.messages.push({ role: 'user', text: cleanUserMessage })
    session.messages.push({ role: 'assistant', text: aiAnswer.trim() })

    progress.markModified('blocksProgress.aiWorkout.currentSession.messages')
    progress.markModified('blocksProgress.aiWorkout.currentSession')
    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000))

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isSessionFinished,
      progressData: progress,
    })
  } catch (error) {
    console.error('Ошибка в generateTimeLimitResponse:', error.message)
    res.status(503).json({ answer: 'Эксперт изучает ваши слайды. Пожалуйста, повторите тезис.' })
  }
}

/**
 * 3. ЗАВЕРШЕНИЕ СЕССИИ (Расчет баллов по speechLogic и timeManagement)
 */
const finishTimeLimitPitchTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    const [progress, course] = await Promise.all([
      UserCourseProgress.findOne({ userId, courseCode }),
      Course.findOne({ courseCode }),
    ])

    if (!progress || !course) {
      return res.status(404).json({ message: 'Данные не найдены в базе данных' })
    }

    const session = progress.blocksProgress?.aiWorkout?.currentSession
    if (!session || session.workoutConfigId !== 'time_limit_pitch') {
      return res.status(400).json({ message: 'Нет активной сессии для данного тренажера' })
    }

    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал'
    )

    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message: 'Защита завершена без оценки из-за отсутствия содержательных ответов',
        totalScore: 0,
        feedback: 'Регламент полностью нарушен. Вы не успели выдать ни одного внятного аргумента.',
        progressData: progress,
      })
    }

    const chatHistory = session.messages
      .map((m) => `${m.role === 'user' ? 'Спикер' : 'Комитет'}: ${m.text}`)
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post('/chat/completions', {
        model: 'GigaChat-2',
        messages: [
          { role: 'system', content: TIME_LIMIT_PITCH_EVALUATION_PROMPT },
          { role: 'user', content: `Проанализируй эту блиц-защиту в условиях цейтнота:\n${chatHistory}` },
        ],
        max_tokens: 700,
      })

      const aiJsonResult = response.data?.choices?.[0]?.message?.content
      if (!aiJsonResult) throw new Error('Пустая строка ответа от ИИ')

      evaluation = parseAiResponse(aiJsonResult, {
        speechLogic: 40,
        timeManagement: 40,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat при оценке time_limit_pitch:', apiError.message)
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'Ваш спич принят советом. Из-за технических проблем подробный отчет недоступен.',
        criteria: { speechLogic: 50, timeManagement: 50 },
      }
    }

    const aiBlockConfig = course.blocks.find((block) => block.blockType === 'ai_workout')
    const requiredScore = aiBlockConfig?.aiWorkoutConfig?.requiredScore || 1000

    progress.blocksProgress.aiWorkout.sessionsCount += 1
     // 🔥 ФЛАГ ДЛЯ ФРОНТЕНДА: пошли ли баллы в зачёт общего прогресса блока
    let isScoreCounted = false

    if (evaluation.totalScore >= 65) {
      // Плюсуем баллы к накопительной системе только если попытка качественная
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }


    if (progress.blocksProgress.aiWorkout.accumulatedScore >= requiredScore) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2 // Авто-переход на этап IRL-челленджа
    } else {
      progress.blocksProgress.aiWorkout.isCompleted = false
    }

    progress.blocksProgress.aiWorkout.currentSession = null

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(200).json({
      status: progress.status,
      currentBlockIndex: progress.currentBlockIndex,
      progressData: progress,
      evaluation: {
        totalScore: evaluation.totalScore,
        feedback: evaluation.feedback,
        criteria: evaluation.criteria,
        isScoreCounted
      },
    })
  } catch (error) {
    console.error('Ошибка финализации тренажера цейтнота:', error)
    return res.status(500).json({ message: 'Внутренняя ошибка сервера при фиксации результатов' })
  }
}

export {
  startTimeLimitPitchTrainer,
  generateTimeLimitResponse,
  finishTimeLimitPitchTrainer,
}
