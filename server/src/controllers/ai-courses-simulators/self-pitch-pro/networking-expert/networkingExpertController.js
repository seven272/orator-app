import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getNetworkingDialogPrompt,
  NETWORKING_EVALUATION_PROMPT,
} from './networkingExpertPrompt.js'

const startNetworkingTrainer = async (req, res) => {
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

    // Защита: проверяем, что пользователь на этапе ИИ-тренажера (индекс 1)
    if (progress.currentBlockIndex !== 1) {
      return res.status(400).json({
        message: 'Вы не можете пройти ИИ-тренажер на текущем этапе курса',
      })
    }

    const preview = `Вы подходите к собеседнику в зоне нетворкинга. Собеседник: ${exerciseData.role}. Контекст: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем структуру сессии
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'networking_expert', // Явно пишем ID текущего тренажёра
      exerciseData,
      messages: [],
      createdAt: new Date(),
    }

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(201).json({ preview, question, progressData: progress })
  } catch (error) {
    console.error('Error in startNetworkingTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте тренажера Нетворкинга',
      error: error.message,
    })
  }
}

const generateNetworkingResponse = async (req, res) => {
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
        message: 'Активная сессия тренажера не найдена. Начните сначала.',
      })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (session.status !== 'active') {
      return res
        .status(400)
        .json({ message: 'Эта сессия уже завершена.' })
    }

    const { role, topic, context } = session.exerciseData

    // Извлекаем аудиофайл из multer
    if (req.file) {
      try {
        console.log('--- ДАННЫЕ ИЗ REQ.FILE (MULTER) ---')
        console.log('Имя поля (fieldname):', req.file.fieldname)
        console.log('MIME-тип от фронта (mimetype):', req.file.mimetype)
        console.log('-----------------------------------')
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка Yandex SpeechKit в нетворкинге:', speechError)
        return res.status(500).json({
          message: 'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    } else {
      return res
        .status(400)
        .json({ message: 'Аудиофайл ответа не был передан.' })
    }

    const attemptsCount = session.messages.filter((m) => m.role === 'user').length
    const isSessionFinished = attemptsCount >= 2 // Конец диалога на 3-й раз

    // Обработка промалчивания / пустого распознавания
    if (
      !userMessage ||
      typeof userMessage !== 'string' ||
      !userMessage.trim()
    ) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })

      progress.markModified('blocksProgress.aiWorkout.currentSession.messages')
      progress.markModified('blocksProgress.aiWorkout.currentSession')
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer: 'Вы ничего не сказали. Собеседник ждет вашего ответа.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getNetworkingDialogPrompt(role, topic, context, cleanUserMessage)

    // Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer) {
      throw new Error('Пустой ответ от GigaChat в тренажере нетворкинга')
    }

    session.messages.push({ role: 'user', text: cleanUserMessage })
    session.messages.push({
      role: 'assistant',
      text: aiAnswer.trim(),
    })

    progress.markModified('blocksProgress.aiWorkout.currentSession.messages')
    progress.markModified('blocksProgress.aiWorkout.currentSession')
    progress.markModified('blocksProgress.aiWorkout')

    await progress.save()

    // Имитация естественной паузы
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1500)

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isSessionFinished,
      progressData: progress,
    })
  } catch (error) {
    console.error('Ошибка в generateNetworkingResponse:', error.message)
    res.status(503).json({
      answer: 'Собеседника кто-то окликнул в толпе. Пожалуйста, повторите фразу.',
    })
  }
}


const finishNetworkingTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    const [progress, course] = await Promise.all([
      UserCourseProgress.findOne({ userId, courseCode }),
      Course.findOne({ courseCode }),
    ])

    if (!progress || !course) {
      return res.status(404).json({ message: 'Необходимые данные не найдены' })
    }

    if (
      progress.currentBlockIndex !== 1 ||
      !progress.blocksProgress?.aiWorkout?.currentSession
    ) {
      return res.status(400).json({
        message: 'Нет активной сессии тренажера или данный блок недоступен',
      })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message: 'Тренажер завершен без оценки из-за отсутствия содержательных ответов',
        totalScore: 0,
        feedback: 'Вы пропустили диалог. Собеседник извинился и отошел к другому стенду.',
        progressData: progress,
      })
    }

    const chatHistory = session.messages
      .map((m) => `${m.role === 'user' ? 'Эксперт' : 'Собеседник'}: ${m.text}`)
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: NETWORKING_EVALUATION_PROMPT },
            { role: 'user', content: `Проанализируй это бизнес-знакомство:\n${chatHistory}` },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        positioning: 40,
        callToAction: 40,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat при оценке нетворкинга:', apiError.message)
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'Ваше знакомство состоялось. Из-за технических неполадок подробный отчет недоступен.',
        criteria: { positioning: 50, callToAction: 50 },
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
      progress.currentBlockIndex = 2 // Переход на IRL
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
    console.error('Ошибка финализации нетворкинга:', error)
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера при фиксации результатов тренажера',
    })
  }
}

export {
  startNetworkingTrainer,
  generateNetworkingResponse,
  finishNetworkingTrainer,
}
