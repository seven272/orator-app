// backend/src/ai-courses-simulators/story-master/hero-journey/heroJourneyController.js

import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getHeroJourneyDialogPrompt,
  HERO_JOURNEY_EVALUATION_PROMPT,
} from './heroJourneyPrompt.js'

/**
 * 1. ИНИЦИАЛИЗАЦИЯ И СТАРТ ТРЕНИРОВКИ "ПУТЬ ГЕРОЯ"
 */
const startHeroJourneyTrainer = async (req, res) => {
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

    const preview = `Вы вошли в переговорную. Собеседник: ${exerciseData.role}. Обстановка: ${exerciseData.context}`
    const question = `${exerciseData.firstQuestion}`

    // Фиксация структуры сессии в базе данных
    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'hero_journey',
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
    console.error('Ошибка в startHeroJourneyTrainer:', error)
    res.status(500).json({
      message: 'Ошибка сервера при запуске тренировки повествования',
      error: error.message,
    })
  }
}

/**
 * 2. ГЕНЕРАЦИЯ И АНАЛИЗ ОЧЕРЕДНОЙ УСТНОЙ РЕПЛИКИ ПОЛЬЗОВАТЕЛЯ
 */
const generateHeroJourneyResponse = async (req, res) => {
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
      session.workoutConfigId !== 'hero_journey'
    ) {
      return res
        .status(400)
        .json({
          message: 'Текущая сессия некорректна или уже завершена.',
        })
    }

    const { role, topic, context } = session.exerciseData

    // Извлечение буфера аудиозаписи и транскрипция речи
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания речи в hero_journey:',
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

    // Обработка ситуации, когда пользователь промолчал или запись пустая
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
          'Вы промолчали. Собеседник удивленно приподнял бровь и продолжил ждать ответа.',
        isSessionFinished,
        isError: true,
        progressData: progress,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getHeroJourneyDialogPrompt(
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

    // Случайная задержка для имитации размышлений персонажа (1-2 секунды)
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
    console.error('Ошибка в generateHeroJourneyResponse:', error)
    res
      .status(503)
      .json({
        answer:
          'В комнате переговоров стало слишком шумно. Собеседник попросил повторить вашу мысль.',
      })
  }
}

/**
 * 3. ЗАВЕРШЕНИЕ СЕССИИ, ИИ-АНАЛИЗ ДРАМАТУРГИИ И ПОДСЧЕТ БАЛЛОВ
 */
const finishHeroJourneyTrainer = async (req, res) => {
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
    if (!session || session.workoutConfigId !== 'hero_journey') {
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
        message: 'Повествование прервано из-за нехватки реплик.',
        totalScore: 0,
        feedback:
          'Слишком много затяжных пауз. Собеседник потерял интерес к вашей истории и закрыл встречу.',
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
              content: HERO_JOURNEY_EVALUATION_PROMPT,
            },
            {
              role: 'user',
              content: `Проанализируй структуру этой истории и драматургию:\n${chatHistory}`,
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
        dramaturgyStructure: 40,
        emotionalHook: 40,
      })
    } catch (apiError) {
      console.error(
        'Сбой GigaChat при финальном расчете результатов hero_journey:',
        apiError.message,
      )
    }

    // Резервный случай при сбое сетевого парсинга JSON
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваша история принят. Подробный драматургический разбор временно недоступен из-за технических накладок.',
        criteria: { dramaturgyStructure: 50, emotionalHook: 50 },
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
    console.error('Ошибка в finishHeroJourneyTrainer:', error)
    return res
      .status(500)
      .json({
        message: 'Внутренняя ошибка сервера при фиксации результатов',
      })
  }
}

export {
  startHeroJourneyTrainer,
  generateHeroJourneyResponse,
  finishHeroJourneyTrainer,
}
