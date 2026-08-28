import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

// 1. Старт упражнения «Тяжелая дикция»
const startPoemTongue = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Получаем объект сценария (id, topic, textToRead, focusSounds)

    // Формируем приветственное сообщение от ИИ с акцентом на целевые звуки
    const preview = `Ваша задача — прочитать текст на одном дыхании, максимально четко разделяя сложные звуки. Фокусные звуки раунда: [${exerciseData.focusSounds.join(', ')}]. \n\nТекст для чтения:\n«${exerciseData.textToRead}»\n\nВключайте запись и читайте без запинок!`

    // Создаем активную сессию в БД
    await AiExercise.create({
      userId,
      exerciseType: 'poem-tongue',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startPoemTongue:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Тяжелая дикция',
      error: error.message,
    })
  }
}

// 2. Обработка аудиозаписи пользователя
const responsePoemTongue = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    // Распознаем аудио через SaluteSpeech
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания SalutSpeech в тяжелой дикции:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать аудиозапись. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    // Ищем активную сессию
    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-tongue',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Защита от молчания
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
          'Вы ничего не прочитали, оценить дикцию невозможно...',
        isFinished: true,
        isError: true,
      })
    }

    // Сохраняем распознанный текст в сессию
    session.messages.push({
      role: 'user',
      text: userMessage.trim(),
    })
    await session.save()

    // Возвращаем результат обратно на фронтенд
    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Текст успешно записан. ИИ-жюри готово к анализу вашей дикции!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responsePoemTongue:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при обработке аудио в упражнении Тяжелая дикция',
      error: error.message,
    })
  }
}

// 3. Анализ и формирование вердикта ИИ-судьи
const finishPoemTongue = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-tongue',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    const userMessages = session.messages.filter(
      (m) => m.role === 'user',
    )

    // Защита от пустой записи
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
          'Текст скороговорки не был зачитан, оценка невозможна.',
        criteria: {
          dictionPurity: 0,
          breathing: 0,
          errorsCount: 0,
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

    // Системный промпт, обучающий ИИ проверять дикцию по текстовой разметке
    const PROMPT = `
      Ты — строгий, но справедливый логопед, эксперт по технике речи и фонолог.
      Пользователь должен был прочитать вслух следующий текст скороговорки:
      "${session.exerciseData.textToRead}"

      При анализе учитывай, что фокусные звуки этого раунда: [${session.exerciseData.focusSounds.join(', ')}].

      Оцени по 100-балльной шкале следующие критерии на основе расшифровки STT (которую тебе пришлют):
        1. "Чистота звуков" (dictionPurity): Сравни оригинальный текст и расшифровку. Снижай баллы, если в расшифровке пропущены буквы, искажены или заменены фокусные звуки, смазаны или утеряны окончания сложных слов.
        2. "Опора дыхания" (breathing): Оценивается по косвенным признакам пунктуации STT. 100 баллов, если текст идет единым плавным блоком. Снижай баллы, если STT расставил хаотичные точки или многоточия посреди коротких фраз (это признак того, что пользователь задыхался, делал судорожные вдохи и рвал темпоритм).
        3. "Безошибочность" (errorsCount): 100 баллов, если текст прочитан с первого раза идеально. Снижай баллы за любые повторы слов, оговорки, исправления («ой, то есть...»), запинки или мусорные звуки (эм, мм, ну), зафиксированные в расшифровке.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <средний балл от 0 до 100>,
        "feedback": "<профессиональный логопедический разбор: отметь, насколько хорошо проговорены фокусные звуки, были ли запинки. 3-4 предложения>",
        "criteria": {
          "dictionPurity": <0-100>,
          "breathing": <0-100>,
          "errorsCount": <0-100>
        }
      }

      Важные правила:
      - Не используй переносы строк внутри полей "feedback".
      - Не ставь лишних запятых.
      - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON-ответа. Если нужно выделить слово или звук, используй кавычки-елочки «».`

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

      const aiJsonResult = response.data.choices[0]?.message?.content
     

      evaluation = parseAiResponse(aiJsonResult, {
        dictionPurity: 50,
        breathing: 50,
        errorsCount: 50,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat в дикции:', apiError.message)
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваше выступление сохранено, но ИИ не смог сформировать детальный отчет по дикции. Попробуйте еще раз позже.',
        criteria: {
          dictionPurity: 50,
          breathing: 50,
          errorsCount: 50,
        },
      }
    }

    // Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Начисляем награды по геймификации (используем алиас из SKILLS_MAP: 'tongue-twister')
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-poem-tongue',
      'Тяжелая дикция',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка анализа речи в упражнении дикции' })
  }
}

export { startPoemTongue, responsePoemTongue, finishPoemTongue }
