import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getStreetRudenessDialogPrompt,
  STREET_RUDENESS_EVALUATION_PROMPT,
} from './streetRudenessPrompt.js'

/**
 * 1. СТАРТ ТРЕНАЖЕРА (Инициализация хамства)
 */
const startStreetRudenessTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode, exerciseData } = req.body

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному интенсиву не найден' })
    }

    if (progress.currentBlockIndex !== 1) {
      return res
        .status(400)
        .json({
          message:
            'Вы не можете пройти ИИ-тренажер на текущем этапе курса',
        })
    }

    const preview = `Конфликт: ${exerciseData.role}. Контекст: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем структуру сессии под ключ street_rudeness
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'street_rudeness',
      exerciseData,
      messages: [],
      createdAt: new Date(),
    }

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res
      .status(201)
      .json({ preview, question, progressData: progress })
  } catch (error) {
    console.error('Error in startStreetRudenessTrainer:', error)
    res
      .status(500)
      .json({
        message: 'Ошибка сервера при старте тренажера хамства',
        error: error.message,
      })
  }
}

/**
 * 2. ХОД СЕССИИ (Прием аудио, транскрипция, ответ хама)
 */
const generateStreetRudenessResponse = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body
    let userMessage = null

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (
      !progress ||
      !progress.blocksProgress?.aiWorkout?.currentSession
    ) {
      return res
        .status(400)
        .json({
          message: 'Активная сессия не найдена. Начните сначала.',
        })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (
      session.status !== 'active' ||
      session.workoutConfigId !== 'street_rudeness'
    ) {
      return res
        .status(400)
        .json({
          message: 'Эта сессия некорректна или уже завершена.',
        })
    }

    const { role, topic, context } = session.exerciseData

    if (req.file) {
      try {
        console.log('--- ДАННЫЕ ИЗ REQ.FILE (MULTER) ---')
        console.log('Имя поля (fieldname):', req.file.fieldname)
        console.log(
          'MIME-тип от фронта (mimetype):',
          req.file.mimetype,
        )
        console.log('-----------------------------------')
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка Yandex SpeechKit в street_rudeness:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    } else {
      return res
        .status(400)
        .json({ message: 'Аудиофайл ответа не был передан.' })
    }

    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isSessionFinished = attemptsCount >= 2 // Конец сессии на 3-й раз (0, 1, 2)

    if (!userMessage || !userMessage.trim()) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })

      progress.markModified(
        'blocksProgress.aiWorkout.currentSession.messages',
      )
      progress.markModified('blocksProgress.aiWorkout.currentSession')
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer:
          'Вы промолчали. Хам воспринимает это как слабость и продолжает нападать.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getStreetRudenessDialogPrompt(
      role,
      topic,
      context,
      cleanUserMessage,
    )

    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 350,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer)
      throw new Error('Пустой ответ от GigaChat в тренажере хамства')

    session.messages.push({ role: 'user', text: cleanUserMessage })
    session.messages.push({
      role: 'assistant',
      text: aiAnswer.trim(),
    })

    progress.markModified(
      'blocksProgress.aiWorkout.currentSession.messages',
    )
    progress.markModified('blocksProgress.aiWorkout.currentSession')
    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000),
    )

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isSessionFinished,
      progressData: progress,
    })
  } catch (error) {
    console.error(
      'Ошибка в generateStreetRudenessResponse:',
      error.message,
    )
    res
      .status(503)
      .json({
        answer:
          'Собеседник агрессивно сплюнул. Пожалуйста, повторите фразу.',
      })
  }
}

/**
 * 3. ЗАВЕРШЕНИЕ СЕССИИ (Финальный ИИ-разбор конфликта)
 */
const finishStreetRudenessTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    const [progress, course] = await Promise.all([
      UserCourseProgress.findOne({ userId, courseCode }),
      Course.findOne({ courseCode }),
    ])

    if (!progress || !course) {
      return res
        .status(404)
        .json({ message: 'Данные не найдены в базе' })
    }

    const session = progress.blocksProgress?.aiWorkout?.currentSession
    if (!session || session.workoutConfigId !== 'street_rudeness') {
      return res
        .status(400)
        .json({
          message: 'Активная сессия тренажера хамства отсутствует',
        })
    }

    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message: 'Тренажер завершен без оценки.',
        totalScore: 0,
        feedback:
          'Вы промолчали во время наезда. Хам зафиксировал доминацию, конфликт не решен.',
        progressData: progress,
      })
    }

    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Хам'}: ${m.text}`,
      )
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            {
              role: 'system',
              content: STREET_RUDENESS_EVALUATION_PROMPT,
            },
            {
              role: 'user',
              content: `Проанализируй этот уличный конфликт:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult =
        response.data?.choices?.[0]?.message?.content
      evaluation = parseAiResponse(aiJsonResult, {
        stressResistance: 40,
        reflection: 40,
      })
    } catch (apiError) {
      console.error(
        'Сбой GigaChat при оценке street_rudeness:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Стычка завершена. Из-за технических неполадок подробный отчет временно недоступен.',
        criteria: { stressResistance: 50, reflection: 50 },
      }
    }

    const aiBlockConfig = course.blocks.find(
      (block) => block.blockType === 'ai_workout',
    )
    const requiredScore =
      aiBlockConfig?.aiWorkoutConfig?.requiredScore || 1000

    progress.blocksProgress.aiWorkout.sessionsCount += 1
    // 🔥 ФЛАГ ДЛЯ ФРОНТЕНДА: пошли ли баллы в зачёт общего прогресса блока
    let isScoreCounted = false

    if (evaluation.totalScore >= 65) {
      // Плюсуем баллы к накопительной системе только если попытка качественная
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }

    if (
      progress.blocksProgress.aiWorkout.accumulatedScore >=
      requiredScore
    ) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2 // Авто-переход на Блок 3: IRL-челлендж!
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
        isScoreCounted,
      },
    })
  } catch (error) {
    console.error('Ошибка финализации тренажера хамства:', error)
    return res
      .status(500)
      .json({
        message: 'Внутренняя ошибка сервера при фиксации результатов',
      })
  }
}

export {
  startStreetRudenessTrainer,
  generateStreetRudenessResponse,
  finishStreetRudenessTrainer,
}
