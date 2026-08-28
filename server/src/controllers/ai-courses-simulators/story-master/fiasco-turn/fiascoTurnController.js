// backend/src/ai-courses-simulators/story-master/fiasco-turn/fiascoTurnController.js

import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getFiascoTurnDialogPrompt,
  FIASCO_TURN_EVALUATION_PROMPT,
} from './fiascoTurnPrompt.js'

/**
 * 1. ИНИЦИАЛИЗАЦИЯ И СТАРТ ТРЕНИРОВКИ "ИЗ ПРОВАЛА В ТРИУМФ"
 */
const startFiascoTurnTrainer = async (req, res) => {
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
        .json({
          message:
            'Прогресс по данному практическому курсу не найден',
        })
    }

    // Защита этапа обучения (ИИ-тренажеры доступны строго на Блоке 1)
    if (progress.currentBlockIndex !== 1) {
      return res.status(400).json({
        message:
          'Вы не можете пройти тренировку на текущем этапе курса',
      })
    }

    const preview = `Вы начали тяжелый разговор. Оппонент: ${exerciseData.role}. Ситуация: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Запись структуры сессии в базу данных
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'fiasco_turn',
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
    console.error('Ошибка в startFiascoTurnTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при запуске тренировки разбора ошибок',
      error: error.message,
    })
  }
}

/**
 * 2. ГЕНЕРАЦИЯ И АНАЛИЗ ОЧЕРЕДНОЙ УСТНОЙ РЕПЛИКИ ПОЛЬЗОВАТЕЛЯ
 */
const generateFiascoTurnResponse = async (req, res) => {
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
          message: 'Активная тренировка не найдена. Начните сначала.',
        })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (
      session.status !== 'active' ||
      session.workoutConfigId !== 'fiasco_turn'
    ) {
      return res
        .status(400)
        .json({
          message: 'Текущая сессия некорректна или уже завершена.',
        })
    }

    const { role, topic, context } = session.exerciseData

    // Извлечение буфера аудиозаписи и транскрипция речи через сервис
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания речи в fiasco_turn:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать устную речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    } else {
      return res
        .status(400)
        .json({ message: 'Аудиофайл с ответом не был передан.' })
    }

    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isSessionFinished = attemptsCount >= 3 // Завершение цепочки диалога на 4-й раз

    // Обработка ситуации, когда пользователь промолчал
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
          'Вы промолчали. Оппонент нахмурился, выражая полное недовольство вашей паузой.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getFiascoTurnDialogPrompt(
      role,
      topic,
      context,
      cleanUserMessage,
    )

    // Запрос к языковой модели GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer)
      throw new Error('Получен пустой ответ от нейросети')

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

    // Симуляция паузы размышлений персонажа (1-2 секунды)
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
    console.error('Ошибка в generateFiascoTurnResponse:', error)
    res
      .status(503)
      .json({
        answer:
          'Разговор стал слишком напряженным. Оппонент прервал вас и попросил отвечать четко по делу.',
      })
  }
}

/**
 * 3. ЗАВЕРШЕНИЕ СЕССИИ, ИИ-АНАЛИЗ ИСКРЕННОСТИ И ВЫВОДОВ С НАКОПЛЕНИЕМ БАЛЛОВ
 */
const finishFiascoTurnTrainer = async (req, res) => {
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
        .json({
          message: 'Необходимые данные не найдены в базе данных',
        })
    }

    const session = progress.blocksProgress?.aiWorkout?.currentSession
    if (!session || session.workoutConfigId !== 'fiasco_turn') {
      return res
        .status(400)
        .json({
          message: 'Активная сессия данного тренажера отсутствует',
        })
    }

    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если содержательных реплик мало — закрываем без проведения оценки
    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null

      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message: 'Разговор прерван из-за нехватки реплик.',
        totalScore: 0,
        feedback:
          'Слишком много затяжных пауз и уклонений от ответов. Оппонент встал и закончил встречу с полным недоверием к вам.',
        progressData: progress,
      })
    }

    // Склейка хронологии диалога для подачи на экспертизу ИИ
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Собеседник'}: ${m.text}`,
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
              content: FIASCO_TURN_EVALUATION_PROMPT,
            },
            {
              role: 'user',
              content: `Проанализируй этот тяжелый разговор и признание ошибок:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult =
        response.data?.choices?.[0]?.message?.content
      if (!aiJsonResult)
        throw new Error('Получена пустая строка от экспертной модели')

      evaluation = parseAiResponse(aiJsonResult, {
        vulnerabilityBalance: 40,
        lessonExtracted: 40,
      })
    } catch (apiError) {
      console.error(
        'Сбой GigaChat при финальном расчете результатов fiasco_turn:',
        apiError.message,
      )
    }

    // Резервный случай при сбое сетевого парсинга JSON
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваш разбор принят. Подробный анализ уровня искренности временно недоступен из-за технических накладок.',
        criteria: { vulnerabilityBalance: 50, lessonExtracted: 50 },
      }
    }

    const aiBlockConfig = course.blocks.find(
      (b) => b.blockType === 'ai_workout',
    )
    const globalRequiredScore =
      aiBlockConfig?.aiWorkoutConfig?.requiredScore || 1000

    progress.blocksProgress.aiWorkout.sessionsCount += 1
    let isScoreCounted = false

    // Зачисление баллов в «стакан общего прогресса» только при качественном ответе (от 65 баллов)
    if (evaluation.totalScore >= 65) {
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }

    // Каскадный переход: если кап баллов набран, переводим на Блок 3 (Практика в реальности)
    if (
      progress.blocksProgress.aiWorkout.accumulatedScore >=
      globalRequiredScore
    ) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2
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
    console.error('Ошибка в finishFiascoTurnTrainer:', error)
    return res
      .status(500)
      .json({
        message: 'Внутренняя ошибка сервера при фиксации результатов',
      })
  }
}

export {
  startFiascoTurnTrainer,
  generateFiascoTurnResponse,
  finishFiascoTurnTrainer,
}
