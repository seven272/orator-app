import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { transcribeLongAudio } from '../../utils/speechService.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startAssociationMaster = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из associationScenarios.js

    // Формируем стартовое описание для экрана
    const preview = `Задание: связать несочетаемое. \nПарадокс: "${exerciseData.situation}". \nПонятие А: "${exerciseData.concept_A}" ➔ Понятие Б: "${exerciseData.concept_B}".`

    // Вводная фраза лингвиста берется напрямую из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-association-master',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        originality: 50, // Стартовый уровень оригинальности связи (медиана)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startAssociationMaster:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Мост смыслов',
      error: error.message,
    })
  }
}

// 2. АНАЛИЗ РЕЧЕВОГО МОСТА (ИГРОВОЙ ПРОЦЕСС)
const generateAssociationMasterResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию тренажера
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-association-master',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудиофайла через боевой SalutSpeech
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка SalutSpeech в Мосте смыслов:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать аудиозапись. Пожалуйста, попробуйте записать ответ еще раз.',
          error: speechError.message,
        })
      }
    }

    // В данном тренажере TOTAL_ROUNDS = 1, так как игрок выдает один цельный спич-мост
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 0 // Первый же ответ пользователя является финальным ходом

    // Обработка молчания
    if (
      !userMessage ||
      typeof userMessage !== 'string' ||
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
          'Вы молчите. Помните, что оратор должен уметь находить связи мгновенно. Жду вашу попытку!',
        isFinished: false, // Даем возможность переписать, если промолчал
        originality: session.exerciseData.originality,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentOriginality =
      Number(session.exerciseData.originality) || 50

    // Профессиональный лингвистический промпт для GigaChat-2
    const PROMPT = `Ты — профессиональный лингвист, эксперт по риторике и критик ассоциативного мышления. Твоя задача — оценить, насколько изящно и глубоко пользователь связал два абсолютно полярных понятия.

КОНТЕКСТ ЗАДАНИЯ:
- Понятие А: "${session.exerciseData.concept_A}"
- Понятие Б: "${session.exerciseData.concept_B}"
- ТВОЙ КРИТИЧЕСКИЙ ФОКУС: "${session.exerciseData.prosecutor_focus}"

⚠️ СТРОГИЕ ПРАВИЛА ФОРМАТА ТВОЕЙ РЕПЛИКИ:
1. Пиши СТРОГО одну реплику лингвиста от первого лица.
2. ЗАПРЕЩЕНО использовать третье лицо (например: "Лингвист кивнул", "улыбнулся", "задумался").
3. ЗАПРЕЩЕНО придумывать продолжение диалога за пользователя.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Лингвист:".
5. Текст должен быть коротким (1-3 предложения), интеллектуальным и емко комментировать качество риторической связи пользователя.

ОЦЕНКА СВЯЗИ:
- Если связь банальна (например, просто через физический материал или в 1 очевидный логический шаг) — это слабый результат.
- Если оратор создал неожиданную метафору, нашел философский подтекст или функциональное сходство — это блестящий результат.

Пользователь только что произнес следующий речевой мост: "${cleanUserMessage}". Ответь ему в своей роли.

В САМОМ КОНЦЕ своего ответа строго добавь маркер изменения уровня оригинальности: ###+число или ###-число (от -25 до +30 в зависимости от глубины метафоры).
Пример идеального ответа: "Потрясающая ментальная гибкость! Объединить эти понятия через концепцию времени — это действительно сильный ораторский ход. ###+25"`

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    // Запрос к нейросети GigaChat

    let aiRawAnswer = await sendGigaChatRequest(
      finalMessagesPayload,
      400,
    )

    // Парсим маркер изменения оригинальности (###+15)
    const originalityMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const originalityChange = originalityMatch
      ? parseInt(originalityMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Защитный фоллбек текста
    if (!cleanAnswer) {
      if (originalityChange > 0) {
        cleanAnswer =
          'Интересная риторическая дуга. Я зафиксировал эту метафору.'
      } else {
        cleanAnswer =
          'Связь кажется слишком поверхностной и очевидной.'
      }
    }

    // Высчитываем новую шкалу оригинальности в границах 0-100
    let newOriginality = currentOriginality + originalityChange
    newOriginality = Math.min(Math.max(newOriginality, 0), 100)

    // Сохраняем ход в базу данных
    session.exerciseData.originality = newOriginality
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Естественная задержка для имитации "размышлений" эксперта
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(1000)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      originality: newOriginality,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Association Master AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer:
        'Лингвистическая экспертиза прервана из-за технических неполадок на стороне ИИ-сервера.',
    })
  }
}

const finishAssociationMaster = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Моста смыслов
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-association-master',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Фильтруем пустые реплики пользователя
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если пользователь промолчал раунд — закрываем с нулем
    if (meaningfulMessages.length < 1) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Связь между понятиями не была установлена, так как вы промолчали.',
        criteria: {
          originality_score: 0,
          metaphor_beauty: 0,
          logic_bridge: 0,
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

    // Формируем стенограмму для ИИ-лингвиста
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Оратор' : 'Лингвист'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям речевой находчивости
    const EVALUATION_PROMPT = `Ты — ведущий эксперт по риторике, стилистике русского языка и ассоциативному мышлению. Проанализируй, как Оратор связал два полярных понятия: "${session.exerciseData.concept_A}" и "${session.exerciseData.concept_B}".

Оцени по 100-балльной шкале следующие критерии:
1. "Оригинальность цепочки" (originality_score): Насколько ассоциативный мост неизбит, далек от банальных логических путей в 1 шаг и удивляет слушателя.
2. "Красота метафор" (metaphor_beauty): Богатство лексикона, использование ярких речевых оборотов, поэтичность и глубина сравнений.
3. "Логика перехода" (logic_bridge): Насколько плавно, связно и аргументированно оратор перевел мысль от понятия А к понятию Б. Есть ли в речи целостный сюжет.

Верни ответ СТРОГО в формате JSON без лишнего художественного текста или вводных знаков вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая конструктивная рецензия от профессора риторики на 2-3 предложения, отмечающая сильные стороны метафоры и дающая совет на будущее>",
  "criteria": {
    "originality_score": <число 0-100>,
    "metaphor_beauty": <число 0-100>,
    "logic_bridge": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот стенограмма выступления:\n${chatHistory}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(messages, countTokens)

      evaluation = parseAiResponse(aiText, {
        originality_score: 50,
        metaphor_beauty: 50,
        logic_bridge: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Моста смыслов:',
        apiError.message,
      )
    }

    // Защитный фоллбек, если ИИ упал или выдал ошибку
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Речь сохранена в архиве лингвистического клуба, но ИИ-арбитр не смог сформировать подробный разбор из-за сбоя связи. Начислен базовый балл.',
        criteria: {
          originality_score: 50,
          metaphor_beauty: 50,
          logic_bridge: 50,
        },
      }
    }

    // Сохраняем результаты сессии в базу данных
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Начисляем опыт, монеты, продвигаем по дейликам
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-association-master',
      'Мост смыслов',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Моста смыслов:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Мост смыслов',
    })
  }
}

export {
  startAssociationMaster,
  generateAssociationMasterResponse,
  finishAssociationMaster,
}
