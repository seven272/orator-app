import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js' // Ваша модель курса для проверки requiredScore
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getObjectionDialogPrompt,
  OBJECTION_EVALUATION_PROMPT,
} from './objectionPrompt.js'

const startObjectionTrainer = async (req, res) => {
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

    // Кастомизируем превью под переговоры и возражения
    const preview = `Вы начинаете сложный диалог с клиентом. Тема встречи: "${exerciseData.topic}". Ваша роль: "${exerciseData.role}". ${exerciseData.context}. \nКлиент настроен скептически, смотрит на вас и говорит...`
    const question = `${exerciseData.firstQuestion}`

    // Инициализируем структуру сессии в рамках существующей схемы
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      exerciseData,
      messages: [],
      createdAt: new Date(),
    }

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startObjectionTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте тренажера возражений',
      error: error.message,
    })
  }
}

const generateObjectionResponse = async (req, res) => {
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

    // 1. Извлекаем аудиофайл из multer
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка синхронного SalutSpeech в возражениях:',
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

    // Считаем количество реплик пользователя
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    // Для возражений увеличиваем лимит до 5 реплик для полноценной дискуссии
    const isObjectionFinished = attemptsCount >= 5

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

      progress.markModified(
        'blocksProgress.aiWorkout.currentSession.messages',
      )
      progress.markModified('blocksProgress.aiWorkout.currentSession')
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer:
          'Вы промолчали. Клиент ждет вашего ответа и начинает терять терпение.',
        isPitchFinished: isObjectionFinished, // Переиспользуем ключ фронта для совместимости или меняем под фронт
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getObjectionDialogPrompt(
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
        max_tokens: 300,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer) {
      throw new Error(
        'Пустой ответ от GigaChat в тренажере возражений',
      )
    }

    // Записываем ходы диалога в сессию
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

    // Имитация естественной паузы размышления клиента
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1500)

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isPitchFinished: isObjectionFinished, // Ключ оставлен для легкой синхронизации с вашим Redux
    })
  } catch (error) {
    console.error(
      'Ошибка в generateObjectionResponse:',
      error.message,
    )
    res.status(503).json({
      answer:
        'Клиент отвлекся на входящий звонок. Пожалуйста, повторите вашу фразу.',
    })
  }
}


const finishObjectionTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    // Ищем прогресс пользователя и параметры курса параллельно
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

    // Защита от вызова вне активного шага
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

    // Если содержательных ответов мало — закрываем подход без баллов
    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message:
          'Тренажер завершен без оценки из-за отсутствия содержательных ответов',
        totalScore: 0,
        feedback:
          'Слишком много пропущенных ответов. Клиент бросил трубку.',
        progressData: progress,
      })
    }

    // Формируем лог переписки для ИИ-критика
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Менеджер' : 'Клиент'}: ${m.text}`,
      )
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: OBJECTION_EVALUATION_PROMPT },
            {
              role: 'user',
              content: `Проанализируй этот диалог отработки возражений:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content

      // Парсим JSON с фолбек-критериями для работы с возражениями
      evaluation = parseAiResponse(aiJsonResult, {
        empathy: 40,
        argumentation: 40,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при оценке возражений:',
        apiError.message,
      )
    }

    // Резервный фолбек на случай полного отказа сети ИИ
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Переговоры завершены. Из-за технических неполадок подробная аналитика временно недоступна.',
        criteria: { empathy: 50, argumentation: 50 },
      }
    }

    // Вытаскиваем необходимый порог очков из конфигурации курса
    const aiBlockConfig = course.blocks.find(
      (block) => block.blockType === 'ai_workout',
    )
    const requiredScore =
      aiBlockConfig?.aiWorkoutData?.requiredScore || 500

    // Накапливаем статистику в общую структуру прогресса блока
    progress.blocksProgress.aiWorkout.sessionsCount += 1
    // 🔥 ФЛАГ ДЛЯ ФРОНТЕНДА: пошли ли баллы в зачёт общего прогресса блока
    let isScoreCounted = false

    if (evaluation.totalScore >= 65) {
      // Плюсуем баллы к накопительной системе только если попытка качественная
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }


    // Логика автоперехода при успешном наборе XP
    if (
      progress.blocksProgress.aiWorkout.accumulatedScore >=
      requiredScore
    ) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2 // Авто-переход на следующий этап
    } else {
      progress.blocksProgress.aiWorkout.isCompleted = false
    }

    // Очищаем сессию перед следующим подходом
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
        criteria: evaluation.criteria, // Передаст объект { empathy, argumentation }
        isScoreCounted
      },
    })
  } catch (error) {
    console.error('Ошибка финализации тренажера возражений:', error)
    return res.status(500).json({
      message:
        'Внутренняя ошибка сервера при фиксации результатов тренажера',
    })
  }
}

export {
  finishObjectionTrainer,
  generateObjectionResponse,
  startObjectionTrainer,
}
