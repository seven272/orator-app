// controllers/ai-exercises/historicalController.js
import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

// 1. Старт упражнения (Инициализация)
const startHistoricalBattle = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Сюда фронтенд присылает объект сценария (id, orator, topic, context, task, hints)

    // Формируем историческое превью для экрана подготовки
    const preview = `Ты выбрал ораторский стиль, который использовал ${exerciseData.orator}. Твоя бытовая задача: "${exerciseData.task}". Внимательно изучи контекст и подсказки. Когда будешь готов, нажми кнопку записи и произнеси свою 90-секундную речь. Постарайся передать дух и риторические приемы великого мастера.`

    // Создаем активную сессию в БД
    const session = await AiExercise.create({
      userId,
      exerciseType: 'ai-historical-battle',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview, sessionId: session._id })
  } catch (error) {
    console.error('Error in startHistoricalBattle:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте батла великих речей',
      error: error.message,
    })
  }
}

// 2. Обработка аудиозаписи и транскрибация через Yandex SpeechKit
const responseHistoricalBattle = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    // Если фронтенд прислал аудиофайл, распознаем его через встроенный Yandex SpeechKit сервис
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания Yandex SpeechKit в историческом батле:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать аудиозапись речи. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    // Ищем последнюю активную сессию исторического батла
    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-historical-battle',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Проверка на молчание
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
          'Вы ничего не сказали, ИИ-судья не может оценить тишину.',
        isFinished: true,
        isError: true,
      })
    }

    // Сохраняем успешно распознанный текст речи в историю сообщений
    session.messages.push({
      role: 'user',
      text: userMessage.trim(),
    })
    await session.save()

    // Возвращаем текст на фронтенд для мгновенного отображения в чате
    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Текст вашей речи успешно зафиксирован и передан ИИ-судье на анализ!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responseHistoricalBattle:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при обработке аудио исторического батла',
      error: error.message,
    })
  }
}

// 3. Финализация и глубокий семантический анализ в GigaChat
const finishHistoricalBattle = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-historical-battle',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
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

    // Аварийный выход, если пользователь промолчал
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
          'Речь не была произнесена. Невозможно оценить ораторское мастерство.',
        criteria: {
          rhetoricalEcho: 0,
          contextualForce: 0,
          argumentDensity: 0,
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

    // Глубокий системный промпт с заточкой под 3 новых критерия и бытовой контекст
    const PROMPT = `
  Ты — строгий, но справедливый профессор риторики, эксперт по ораторскому искусству и лингвистический судья.
  Пользователь прошел тренажер "Эхо Истории", где он должен был произнести бытовую речь, подражая великому историческому оратору.

  Оратор-прототип: "${session.exerciseData.orator}".
  Бытовой контекст и жизненная ситуация: "${session.exerciseData.context}".
  Конкретное задание для речи: "${session.exerciseData.task}".
  Опорные подсказки стиля: "${session.exerciseData.hints.join(', ')}".

  Проанализируй текст устной речи пользователя и оцени его строго по 100-балльной шкале по трем критериям:
  1. "Риторическое эхо" (rhetoricalEcho): Насколько хорошо пользователь перенес главный структурный или художественный прием мастера в быт. 
     - Если прототип Стив Джобс — использовал ли пользователь прием "соединения точек" (связь прошлых факапов со счастливым настоящим)?
     - Если прототип Черчилль — использовал ли монолитную анафору (ритмичные списки-повторения мест борьбы)?
     - Если прототип Македонский — есть ли антитеза "Было/Стало" и взывание к совести через личный пример?
     - Если прототип Кинг — звучит ли вдохновляющий рефрен (повтор ключевой фразы-мечты)?
  2. "Сила контекста" (contextualForce): Удалось ли пользователю адаптировать масштаб эмоций под бытовую задачу. Речь должна звучать органично для житейской ситуации, но сохранять нужный психологический накал (искренность, непреклонность или царственное укрощение толпы).
  3. "Плотность аргументации" (argumentDensity): Наличие в 90-секундном тексте хлестких примеров, жизненных фактов или запоминающихся метафор вместо "воды" и пустых рассуждений.

  Выведи средний итоговый балл в поле totalScore.

  Ответь СТРОГО в формате JSON. Не пиши ничего, кроме самого JSON-объекта. 
  Внутри поля "feedback" пиши текст строго в одну строку, не используй переносы строк и символы табуляции. 
  Если нужно выделить слово или имя оратора внутри "feedback", используй кавычки-елочки «». 
  Следи, чтобы после закрывающей кавычки в поле "feedback" сразу шла запятая, без лишних пробелов или скрытых знаков.

  Шаблон JSON для заполнения:
  {
    "totalScore": 0,
    "feedback": "Текст рецензии",
    "criteria": {
      "rhetoricalEcho": 0,
      "contextualForce": 0,
      "argumentDensity": 0
    }
  }`

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
      console.log(
        '🗣️ [Historical Battle] Сырой ответ от GigaChat:',
        aiJsonResult,
      )

      let cleanedJson = aiJsonResult
        ? aiJsonResult
            .replace(/\n/g, ' ') // Заменяем все физические переносы строк на пробелы
            .replace(/"\s+,/g, '",') // Убираем пробелы между закрывающей кавычкой и запятой
            .replace(/"\s+}/g, '"}') // Убираем пробелы перед закрывающей фигурной скобкой
        : null

      // Используем ваш безопасный парсер с новыми дефолтными критериями
      evaluation = parseAiResponse(cleanedJson, {
        rhetoricalEcho: 50,
        contextualForce: 50,
        argumentDensity: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в историческом батле:',
        apiError.message,
      )
    }

    // Фоллбек на случай сбоя генерации
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Твоя великая речь сохранена в архиве истории, но ИИ-судья временно взял паузу. Детальный разбор не сформировался, попробуй повторить запись позже.',
        criteria: {
          rhetoricalEcho: 50,
          contextualForce: 50,
          argumentDensity: 50,
        },
      }
    }

    // Запись результатов сессии в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }
    await session.save()

    // Запуск вашего сквозного движка геймификации.
    // Передаем уникальный алиас 'ai-historical-battle' для правильного распределения навыков ритора
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-historical-battle',
      'Эхо Истории',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено и проанализировано',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка в finishHistoricalBattle:', error)
    res
      .status(500)
      .json({
        message: 'Ошибка анализа исторической речи на сервере',
      })
  }
}

export {
  startHistoricalBattle,
  responseHistoricalBattle,
  finishHistoricalBattle,
}
