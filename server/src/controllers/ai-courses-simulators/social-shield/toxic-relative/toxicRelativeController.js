import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getToxicRelativeDialogPrompt,
  TOXIC_RELATIVE_EVALUATION_PROMPT,
} from './toxicRelativePrompt.js'

const startToxicRelativeTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode, exerciseData } = req.body // Прилетает courseCode ('social_shield') и сценарий

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному интенсиву не найден' })
    }

    // Защита: проверяем, что пользователь на этапе ИИ-тренажера (индекс 1)
    if (progress.currentBlockIndex !== 1) {
      return res.status(400).json({
        message:
          'Вы не можете пройти ИИ-тренажер на текущем этапе курса',
      })
    }

    const preview = `Ситуация: ${exerciseData.role}. Контекст: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем изолированную структуру сессии под ключ toxic_relative
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'toxic_relative',
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
    console.error('Error in startToxicRelativeTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте тренажера манипуляций',
      error: error.message,
    })
  }
}
const generateToxicRelativeResponse = async (req, res) => {
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
      return res.status(400).json({
        message:
          'Активная сессия тренажера не найдена. Начните сначала.',
      })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (session.status !== 'active') {
      return res
        .status(400)
        .json({ message: 'Эта сессия уже завершена.' })
    }

    const { role, topic, context } = session.exerciseData

    // 1. Извлекаем аудиофайл из multer (он лежит в req.file из-за thunk-ключа 'file')
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
          'Ошибка Yandex SpeechKit в toxic_relative:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь клиентом. Пожалуйста, повторите запись.',
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
    const isSessionFinished = attemptsCount >= 2 // Конец диалога на 3-й раз (индексы ответов: 0, 1, 2)

    // 2. Обработка промалчивания / пустого распознавания
    if (
      !userMessage ||
      typeof userMessage !== 'string' ||
      !userMessage.trim()
    ) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })

      // Фиксируем мутации глубоких путей Mongoose
      progress.markModified(
        'blocksProgress.aiWorkout.currentSession.messages',
      )
      progress.markModified('blocksProgress.aiWorkout.currentSession')
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer:
          'Вы промолчали. Собеседник тяжело вздыхает и продолжает давить на жалость.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getToxicRelativeDialogPrompt(
      role,
      topic,
      context,
      cleanUserMessage,
    )

    // 3. Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 350,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer) {
      throw new Error(
        'Пустой ответ от GigaChat в тренажере Токсичный знакомый',
      )
    }

    // Записываем ходы диалога в сессию прогресса
    session.messages.push({ role: 'user', text: cleanUserMessage })
    session.messages.push({
      role: 'assistant',
      text: aiAnswer.trim(),
    })

    // Помечаем измененными абсолютно все уровни вложенности объекта сессии
    progress.markModified(
      'blocksProgress.aiWorkout.currentSession.messages',
    )
    progress.markModified('blocksProgress.aiWorkout.currentSession')
    progress.markModified('blocksProgress.aiWorkout')

    await progress.save()

    // Имитация естественной паузы
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1500)

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isSessionFinished,
      progressData: progress,
    })
  } catch (error) {
    console.error('Ошибка в generateVipCloseResponse:', error.message)
    res.status(503).json({
      answer:
        'Собеседник демонстративно отвернулся. Пожалуйста, повторите фразу.',
    })
  }
}

const finishToxicRelativeTrainer = async (req, res) => {
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
    if (!session || session.workoutConfigId !== 'toxic_relative') {
      return res.status(400).json({
        message: 'Активная сессия тренажера манипуляций отсутствует',
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
          'Вы пропустили диалог. Манипулятор зафиксировал вашу покорность и чувство вины.',
        progressData: progress,
      })
    }

    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Манипулятор'}: ${m.text}`,
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
              content: TOXIC_RELATIVE_EVALUATION_PROMPT,
            },
            {
              role: 'user',
              content: `Проанализируй эти семейные переговоры:\n${chatHistory}`,
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
        'Сбой GigaChat при оценке toxic_relative:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваш диалог принят. Из-за технических неполадок подробный отчет временно недоступен.',
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
    console.error('Ошибка финализации тренажера манипуляций:', error)
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера при фиксации результатов',
    })
  }
}

export {
  startToxicRelativeTrainer,
  generateToxicRelativeResponse,
  finishToxicRelativeTrainer,
}
