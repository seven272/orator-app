import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

const startTribune = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `В этом упражнении ваша задача уверенно и убедительно высказаться по заданной теме. Тема:  "${exerciseData.topic}". Задание: "${exerciseData.task}" В своей речи можешь использовать следующие подсказки [${exerciseData.hints.join('/')}], которые помогут раскрыть тему. Жду вашей речи и приступаю к анализу.`

    // Создаем сессию в БД
    await AiExercise.create({
      userId,
      exerciseType: 'tribune',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Трибуна`,
      error: error.message,
    })
  }
}

const responseTribune = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage // Берем текст из body, если он пришел (для совместимости)

  try {
    // 1. Если фронтенд прислал аудиофайл, распознаем его через SalutSpeech API
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания SalutSpeech в трибуне:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать аудиозапись. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    // 2. Ищем активную сессию именно для tribune (исправили ошибку с icebreaker)
    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'tribune',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // 3. Обработка пустого ответа или промалчивания
    if (
      !userMessage ||
      !userMessage.trim() ||
      userMessage.includes('нечего сказать')
    ) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })
      await session.save()

      return res.status(200).json({
        answer: 'Вы ничего не сказали, оценить пустоту я не могу...',
        isFinished: true,
        isError: true,
      })
    }

    // 4. Сохраняем успешно распознанный (или пришедший текстом) месседж в историю
    session.messages.push({
      role: 'user',
      text: userMessage.trim(),
    })
    await session.save()

    // Возвращаем распознанный текст (user_transcript) обратно на фронтенд,
    // чтобы мобильное приложение мгновенно отобразило пользователю, что именно он наговорил.
    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer: 'Текст получен, готов приступать к разбору!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responseTribune:', error)
    res.status(500).json({
      message: `Ошибка сервера при обработке сообщения упражнения Трибуна`,
      error: error.message,
    })
  }
}

const finishTribune = async (req, res) => {
  try {
    const userId = req.userId 
    const { isDaily } = req.body
    // Ищем активную сессию именно для icebreaker
    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'tribune',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Загружаем профиль пользователя для начисления наград
    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Формируем историю для анализа
    const userMessages = session.messages.filter(
      (m) => m.role === 'user',
    )

    // Защита от пустого массива, если пользователь промолчал
    if (
      userMessages.length === 0 ||
      userMessages[userMessages.length - 1].text ===
        'Пользователь промолчал'
    ) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Речь не была произнесена, оценить выступление невозможно.',
        criteria: {
          structure: 0,
          persuasiveness: 0,
          garbage: 0,
        },
      }
      await session.save()

      return res.status(200).json({
        message: 'Упражнение завершено без оценки',
        session,
        earnedXp: 0,
        earnedCoins: 0,
        isLevelUp: false,
        newAchievements: [],
        daily_task_update: null,
        stats: null,
      })
    }

    const userSpeechText = userMessages[userMessages.length - 1].text

    const PROMPT = `
      Ты — эксперт по ораторскому искусству и лингвистический аналитик.
      Тема выступления: "${session.exerciseData.topic}".
      Задача пользователя: "${session.exerciseData.task}".

       Оцени по 100-балльной шкале следующие критерии:
        1. "Структура" (structure): 100 баллов, если есть четкое вступление (крючок), основной тезис и призыв к действию (финал). Снижай баллы за хаотичность мыслей.
        2. "Убедительность" (persuasiveness): Ищи глаголы действия, факты, цифры или сильные метафоры. 100 баллов за высокую энергию текста и четкую позицию.
        3. "Словесный мусор" (garbage): 100 баллов, если в тексте НЕТ слов-паразитов (ну, как бы, это), канцеляризмов (вследствие того что, осуществляется деятельность) и заезженных штампов.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <0-100>,
        "feedback": "<общий разбор: сильные и слабые стороны. 3-4 предложения>",
        "criteria": {
          "structure": <0-100>,
          "persuasiveness": <0-100>,
          "garbage": <0-100>
        }

         Важные правила:
        - Не используй переносы строк внутри полей "feedback".
        - Не ставь лишних запятых.
        - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON-ответа. Если нужно выделить слово, используй кавычки-елочки «».`

    let evaluation // объявляем переменную сверху

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: PROMPT },
            { role: 'user', content: userSpeechText },
          ],
        },
      )

      const aiJsonResult = response.data.choices[0]?.message?.content

      console.log('🗣️ Сырой ответ от GigaChat:', aiJsonResult) // Отличный лог для дебага

      // Вызываем парсер. Если он вернет null/undefined, сработает ваш if ниже
      evaluation = parseAiResponse(aiJsonResult, {
        structure: 50,
        persuasiveness: 50,
        garbage: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat (ECONNRESET):',
        apiError.message,
      )
      // Оставляем evaluation пустым, чтобы управление перешло в ваш аварийный блок
    }

    // Аварийный выход, если ИИ выдал невалидный JSON или упала сеть
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваше выступление сохранено, но ИИ не смог сформировать детальный отчет. Попробуйте еще раз позже.',
        criteria: {
          structure: 50,
          persuasiveness: 50,
          garbage: 50,
        },
      }
    }

    //  Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Запуск сквозного движка геймификации.
    // Алиас 'ai-tribune' автоматически прокачает ветку "убедительность" по SKILLS_MAP!
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-tribune',
      'Трибуна',
      isDaily,
    ) 

    // Отдаем клиенту правильную структуру для синхронизации Redux
    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ошибка анализа речи' })
  }
}

export { startTribune, responseTribune, finishTribune }
