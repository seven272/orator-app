import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

const startRandomWord = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    const preview = `Упражнение «Слово из шляпы». Ваша тема: «${exerciseData.topic}». \n\nВнимание, ваше секретное слово из шляпы: СТРОГО «${exerciseData.secretWord}»! \n\nЗадание: ${exerciseData.task} Включайте запись и начинайте импровизировать.`

    await AiExercise.create({
      userId,
      exerciseType: 'random-word',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startRandomWord:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Слово из шляпы',
      error: error.message,
    })
  }
}

const responseRandomWord = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer) 
      } catch (speechError) {
        console.error(
          'Ошибка распознавания в слове из шляпы:',
          speechError,
        )
        return res.status(500).json({
          message: 'Не удалось распознать аудиозапись.',
          error: speechError.message,
        })
      }
    }

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'random-word',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

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
        answer:
          'Вы ничего не сказали, оценить импровизацию невозможно...',
        isFinished: true,
        isError: true,
      })
    }

    session.messages.push({ role: 'user', text: userMessage.trim() })
    await session.save()

    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Речь успешно записана! ИИ-жюри приступает к оценке интеграции секретного слова.',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responseRandomWord:', error)
    res.status(500).json({
      message: 'Ошибка сервера при обработке аудио в слове из шляпы',
      error: error.message,
    })
  }
}

const finishRandomWord = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // 1. Ищем активную сессию импровизации
    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'random-word',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Загружаем профиль пользователя
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const userMessages = session.messages.filter((m) => m.role === 'user')

    // 2. Безопасная заглушка, если пользователь промолчал
    if (
      userMessages.length === 0 ||
      userMessages[userMessages.length - 1].text === 'Пользователь промолчал'
    ) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback: 'Речь не была произнесена, оценка импровизации невозможна.',
        criteria: { integration: 0, logic: 0, charisma: 0 },
      }
      await session.save()

      // Возвращаем полную структуру для синхронизации Redux на фронте
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

    // Системный промпт для GigaChat
    const PROMPT = `
      Ты — стендап-комик, эксперт по речевой импровизации и мастер разговорного жанра.
      Тема выступления пользователя: "${session.exerciseData.topic}".
      Секретное слово из шляпы, которое он был ОБЯЗАН использовать: "${session.exerciseData.secretWord}".

      Оцени по 100-балльной шкале следующие критерии на основе расшифровки текста пользователя:
        1. "Органичность" (integration): 100 баллов, если секретное слово вплетено нативно, красиво, создаёт смешной или сильный образ и не выглядит вырванным из контекста. Ставь 0 баллов, если пользователь вообще не произнёс слово или просто сказал в конце: «А еще я говорю слово ${session.exerciseData.secretWord}».
        2. "Логика и связность" (logic): 100 баллов, если монолог, несмотря на интеграцию чужеродного слова, сохранил общую мысль, понятный сюжет и не превратился в хаотичный набор фраз.
        3. "Харизма и юмор" (charisma): Оцени оригинальность мышления, иронию, артистизм текста, наличие шуток или ярких метафор.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <средний балл от 0 до 100>,
        "feedback": "<остроумный разбор выступления: похвали за красивый речевой мост или укажи, где интеграция слова сломала логику. 3-4 предложения>",
        "criteria": {
          "integration": <0-100>,
          "logic": <0-100>,
          "charisma": <0-100>
        }
      }

      Важные правила:
      - Не используй переносы строк внутри полей "feedback".
      - Не ставь лишних запятых.
      - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON. Используй кавычки-елочки «».`

    let evaluation

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

      let aiJsonResult = response.data?.choices?.[0]?.message?.content
      console.log('🗣️ Сырой ответ от GigaChat (Импровизация):', aiJsonResult)
      
      evaluation = parseAiResponse(aiJsonResult, {
        integration: 50,
        logic: 50,
        charisma: 50,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat в слове из шляпы:', apiError.message)
    }

    // Аварийный стейт при поломке JSON-парсера
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'Ваша импровизация сохранена, но ИИ сломал шляпу при парсинге. Попробуйте позже.',
        criteria: { integration: 50, logic: 50, charisma: 50 },
      }
    }

    // ИСПРАВЛЕНО: Разделили склеенные строки и убрали SyntaxError
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }
    
    await session.save()

    // Запускаем начисление опыта (алиас 'ai-random-word' должен быть в SKILLS_MAP в харизме или находчивости)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-random-word',
      'Слово из шляпы',
      isDaily
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка анализа речи в импровизации' })
  }
}


export { startRandomWord, responseRandomWord, finishRandomWord }
