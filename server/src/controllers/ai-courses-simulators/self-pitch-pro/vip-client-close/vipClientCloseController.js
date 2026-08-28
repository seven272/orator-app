import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getVipCloseDialogPrompt,
  VIP_EVALUATION_PROMPT,
} from './vipClientClosePrompt.js'

const startVipCloseTrainer = async (req, res) => {
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
        message:
          'Вы не можете пройти ИИ-тренажер на текущем этапе курса',
      })
    }

    const preview = `Вы начинаете встречу. Собеседник: ${exerciseData.role}. Контекст: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем структуру сессии (валидируется схемой)
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'vip_client_close', // Явно пишем ID текущего тренажёра
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
    console.error('Error in startVipCloseTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте тренажера VIP-клиента',
      error: error.message,
    })
  }
}

const generateVipCloseResponse = async (req, res) => {
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
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка асинхронного Yandex SpeechKit в VIP-тренажере:',
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
    const isSessionFinished = attemptsCount >= 3 // Конец диалога на 3-й раз (индексы ответов: 0, 1, 2)

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
          'Вы ничего не сказали. VIP-клиент ждет конкретики и ответов на свои вопросы.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getVipCloseDialogPrompt(
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
        'Пустой ответ от GigaChat в тренажере VIP-клиента',
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

    return res.status(200).json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isSessionFinished,
      progressData: progress,
    })
  } catch (error) {
    console.error('Ошибка в generateVipCloseResponse:', error.message)

    return res.status(503).json({
      message:
        'Клиент отвлекся на входящее уведомление. Пожалуйста, повторите фразу.',
    })
  }
}

const finishVipCloseTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    // Ищем прогресс и сам курс параллельно (из вашей оригинальной логики)
    const [progress, course] = await Promise.all([
      UserCourseProgress.findOne({ userId, courseCode }),
      Course.findOne({ courseCode }),
    ])

    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному интенсиву не найден' })
    }
    if (!course) {
      return res
        .status(404)
        .json({ message: 'Интенсив не найден в базе данных' })
    }

    if (
      progress.currentBlockIndex !== 1 ||
      !progress.blocksProgress?.aiWorkout?.currentSession
    ) {
      return res.status(400).json({
        message:
          'Нет активной сессии тренажера или данный блок недоступен',
      })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если содержательных ответов мало — закрываем подход с 0 баллов
    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null // Сбрасываем сессию

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message:
          'Тренажер завершен без оценки из-за отсутствия содержательных ответов',
        totalScore: 0,
        feedback:
          'Слишком много пропущенных ответов. Клиент завершил созвон.',
        progressData: progress,
      })
    }

    // Формируем лог переписки для ИИ-оценщика
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Эксперт' : 'VIP-Клиент'}: ${m.text}`,
      )
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: VIP_EVALUATION_PROMPT },
            {
              role: 'user',
              content: `Проанализируй эти b2b-переговоры:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        usp: 40,
        painFocus: 40,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при оценке vip_client_close:',
        apiError.message,
      )
    }

    // Фолбек на случай сбоев сети
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваши тезисы приняты клиентом. Из-за технических неполадок подробный отчет недоступен, начислен средний балл.',
        criteria: { usp: 50, painFocus: 50 },
      }
    }

    // Вытаскиваем необходимый порог очков из конфигурации курса
    const aiBlockConfig = course.blocks.find(
      (block) => block.blockType === 'ai_workout',
    )
    const requiredScore =
      aiBlockConfig?.aiWorkoutConfig?.requiredScore || 1000

    // Обновляем статистику вашего блока
    progress.blocksProgress.aiWorkout.sessionsCount += 1
    // 🔥 ФЛАГ ДЛЯ ФРОНТЕНДА: пошли ли баллы в зачёт общего прогресса блока
    let isScoreCounted = false

    if (evaluation.totalScore >= 65) {
      // Плюсуем баллы к накопительной системе только если попытка качественная
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }

    // Проверяем, набрал ли пользователь нужную сумму баллов суммарно за все подходы
    if (
      progress.blocksProgress.aiWorkout.accumulatedScore >=
      requiredScore
    ) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2 // Авто-переход на этап IRL-челленджа!
    } else {
      progress.blocksProgress.aiWorkout.isCompleted = false
    }

    // Сбрасываем временную сессию, так как этот подход полностью завершен и оценен
    progress.blocksProgress.aiWorkout.currentSession = null

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    // Возвращаем результат, идеально синхронизированный с вашим Redux
    return res.status(200).json({
      status: progress.status,
      currentBlockIndex: progress.currentBlockIndex,
      progressData: progress,
      // Метаданные для отображения вердикта на фронтенде по критериям usp и painFocus:
      evaluation: {
        totalScore: evaluation.totalScore,
        feedback: evaluation.feedback,
        criteria: evaluation.criteria,
        isScoreCounted,
      },
    })
  } catch (error) {
    console.error('Ошибка финализации тренажера VIP-клиента:', error)
    return res.status(500).json({
      message:
        'Внутренняя ошибка сервера при фиксации результатов тренажера',
    })
  }
}

export {
  startVipCloseTrainer,
  generateVipCloseResponse,
  finishVipCloseTrainer,
}
