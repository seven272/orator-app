import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startAlibi = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем вводный контекст для экрана
    const preview = `Вы в комнате допроса. Дело: "${exerciseData.situation}". Ваша легенда: "${exerciseData.legend}". Следователь сфокусирован на следующем: ${exerciseData.prosecutor_focus}`

    // Первая реплика берется напрямую из настроек сценария
    const question = exerciseData.init_phrase
 
    await AiExercise.create({
      userId,
      exerciseType: 'alibi',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        credibility: 50, // Начальное доверие
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startAlibi:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Железное алиби`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generateAlibiResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для alibi
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'alibi',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Расшифровка аудио через SalutSpeech
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка синхронного SalutSpeech в алиби:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 2 // Так как TOTAL_ROUNDS = 3 (индексы 0, 1, 2)

    // Обработка молчания пользователя
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
          'Вы молчите... Ваше молчание прокурор расценит как признание вины. Отвечайте на вопрос!',
        isFinished: isLastAttempt,
        credibility: session.exerciseData.credibility,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentCredibility =
      Number(session.exerciseData.credibility) || 50

    const PROMPT = `Ты — строгий, дотошный следователь. Ты ведешь допрос в реальном времени.

КОНТЕКСТ ДЕЛА:
- Происшествие: "${session.exerciseData.situation}".
- Легенда подозреваемого: "${session.exerciseData.legend}".
- ТВОЙ ГЛАВНЫЙ ФОКУС ОБВИНЕНИЯ: "${session.exerciseData.prosecutor_focus}". Дави строго на эти нестыковки и улики.

ТЕКУЩИЙ УРОВЕНЬ ДОВЕРИЯ К ПОДОЗРЕВАЕМОМУ: ${currentCredibility} из 100.
1. Если доверие < 40: открыто сомневайся, обвиняй во лжи, иронизируй, задавай жесткие вопросы.
2. Если доверие 40-70: веди допрос профессионально, цепляйся за детали ответа, ищи новые противоречия.
3. Если доверие > 70: временно ослабь хватку, соглашайся, но задавай финальные уточняющие вопросы для протокола.

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику следователя от первого лица. 
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Следователь посмотрел", "наклонился", "вздохнул").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Следователь:".
5. Текст должен быть коротким (1-3 предложения), емким и бить точно по ответу пользователя.

Пользователь только что сказал: "${cleanUserMessage}". Ответь ему как следователь.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня доверия: ###+число или ###-число (от -15 до +15 в зависимости от убедительности ответа пользователя).
Пример идеального ответа: "Допустим, но откуда на руле ваши отпечатки? Объясните это. ###-10"`

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    // Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: finalMessagesPayload,
        max_tokens: 400,
      },
    )

    const aiRawAnswer = response.data?.choices?.[0]?.message?.content

    // Парсим изменение доверия (###+10)
    const credibilityMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const credibilityChange = credibilityMatch
      ? parseInt(credibilityMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Защитный фоллбек, если ИИ вернул пустой текст
    if (!cleanAnswer) {
      if (credibilityChange > 0) {
        cleanAnswer = 'Допустим. Документы это подтверждают...'
      } else if (credibilityChange < 0) {
        cleanAnswer = 'Вы путаетесь в показаниях. Я вам не верю.'
      } else {
        cleanAnswer = 'Записано с ваших слов. Продолжайте.'
      }
    }

    // Обновляем шкалу доверия в пределах 0-100
    let newCredibility = currentCredibility + credibilityChange
    newCredibility = Math.min(Math.max(newCredibility, 0), 100)

    // Сохраняем шаг в БД
    session.exerciseData.credibility = newCredibility
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Имитация раздумий ИИ
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1000)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      credibility: newCredibility,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Alibi AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer:
        'Следователь прервал допрос из-за помех в системе аудиопротоколирования. (Ошибка связи)',
    })
  }
}

// 3. ФИЛИАЛИЗАЦИЯ И ОЦЕНКА
const finishAlibi = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'alibi',
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

    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Слишком много безответных вопросов, выстроить защиту не удалось.',
        criteria: { logic: 0, consistency: 0, confidence: 0 },
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

    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Подозреваемый' : 'Следователь'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям "Убедительности"
    const EVALUATION_PROMPT = `Ты — эксперт по судебной риторике, жестким дебатам и аргументации. Проанализируй стенограмму допроса, где Пользователь (Подозреваемый) защищал свое алиби.

Оцени по 100-балльной шкале следующие критерии:
1. "Логика и структура" (logic): Насколько последовательно выстроены аргументы защиты, есть ли четкие тезисы.
2. "Непротиворечивость фактов" (consistency): Удавалось ли пользователю удерживать нить легенды и не противоречить своим предыдущим ответам.
3. "Устойчивость под давлением" (confidence): Уверенность тона, отсутствие оправдательной позиции, умение четко парировать каверзные вопросы.

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 предложения о том, насколько убедительной была аргументация>",
  "criteria": {
    "logic": <число 0-100>,
    "consistency": <число 0-100>,
    "confidence": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: EVALUATION_PROMPT },
            {
              role: 'user',
              content: `Вот протокол допроса:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        logic: 50,
        consistency: 50,
        confidence: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в Железном алиби:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Показания сохранены в протоколе, но ИИ-судья не смог сформировать подробный отчет из-за сбоя связи. Начислен базовый балл.',
        criteria: { logic: 50, consistency: 50, confidence: 50 },
      }
    }

    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-alibi',
      'Железное алиби',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации алиби:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Железное алиби',
    })
  }
}
export { startAlibi, generateAlibiResponse, finishAlibi }
