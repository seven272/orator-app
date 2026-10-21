import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { transcribeShortAudio } from '../../utils/speechService.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startCommercialPitch = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный бытовой предмет из pitchScenarios.js

    // Формируем вводный контекст для экрана
    const preview = `Предмет для презентации: "${exerciseData.situation}". \nЛегенда стартапа: ${exerciseData.legend} \nСкепсис Эдуарда: ${exerciseData.prosecutor_focus}`

    // Стартовая язвительная реплика Эдуарда
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-commercial-pitch',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        interest: 50, // Стартовый интерес венчурного капиталиста (0-100)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startCommercialPitch:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Суровый Инвестор Эдуард`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generatePitchResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для Сурового Инвестора
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-commercial-pitch',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // 🛡️ Защита 1: Расшифровка аудио через службу SalutSpeech с мягким фоллбеком
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          '⚠️ [Сбой инфраструктуры речи] Фоллбек для Инвестора активирован:',
          speechError.message,
        )
        // Если Яндекс недоступен, симулируем уверенный питч с базовыми триггерами (УТП, Боль, Цифры)
        userMessage = `Эдуард, наш стартап на базе продукта "${session.exerciseData.situation}" решает главную боль миллионов пользователей. Наше УТП — это 200% экономия времени и полная автоматизация процесса. Рынок оценивается в миллиард долларов, и мы заберем 10% уже в первый год. Предлагаю вам долю за инвестиции.`
      }
    }

    // Считаем раунды (TOTAL_ROUNDS = 3)
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 2

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
          'Ну и чего ты молчишь? Время — деньги, парень. Моя минута стоит дороже твоего стартапа. Говори суть, или охрана выведет тебя!',
        isFinished: isLastAttempt,
        interest: session.exerciseData.interest,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentInterest =
      Number(session.exerciseData.interest) || 50

    // Формируем жесткий системный промпт для циничного инвестора Эдуарда
    const PROMPT = `Ты — циничный, прагматичный венчурный инвестор Эдуард. Ты акула бизнеса и ценишь только выгоду, цифры, маржинальность и четкую структуру. Ты слушаешь Elevator Pitch стартапа в реальном времени.

КОНТЕКСТ ПИТЧА:
- Продукт, который тебе продают: "${session.exerciseData.situation}".
- Главный триггер твоего скепсиса: "${session.exerciseData.prosecutor_focus}". Постоянно бей в эту уязвимость бизнес-модели.

ТЕКУЩИЙ УРОВЕНЬ ТВОЕГО ИНТЕРЕСА К СТАРТАПУ: ${currentInterest} из 100.
1. Если интерес < 40: веди себя язвительно, откровенно скучай, зевай, говори, что продукт — мусор, а бизнес-модель мертва.
2. Если интерес 40-70: веди жесткий профессиональный допрос, требуй цифры, юнит-экономику, цепляйся к конкурентам, проверяй фаундера на прочность.
3. Если интерес > 70: ты начинаешь чувствовать запах денег. Слегка ослабь хватку, проявляй деловой азарт, задавай финальные уточняющие вопросы по долям и окупаемости для протокола.

⚠️ ТВОИ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику инвестора от первого лица.
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Эдуард поправил галстук", "вздохнул", "закурил").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Эдуард:".
5. Текст должен быть коротким (1-3 предложения), емким и бить точно по бизнес-аргументам пользователя.

МАРКЕТИНГОВЫЙ АНАЛИЗ РЕЧИ:
Оцени, использует ли пользователь ключевые триггеры продаж:
- Описал ли он боль целевой аудитории?
- Сформулировал ли внятное УТП?
- Назвал ли цифры, объемы рынка или сделал ли призыв к действию (CTA)?
Если речь состоит из пустой заумной воды — твой интерес падает. Если он бьет фактами и выгодой — интерес растет.

Пользователь только что сказал: "${cleanUserMessage}". Ответь ему в роли Эдуарда.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения твоего интереса: ###+число или ###-число (от -15 до +15 в зависимости от убедительности маркетинга пользователя).
Пример идеального ответа: "Цифры сходятся, но как вы собираетесь решать проблему с логистикой в регионах? Объясните мне это. ###+10"`

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    let aiRawAnswer = ''

    // 🛡️ Защита 2: Мягкий фоллбек на случай сбоя сети GigaChat API (500 Error)
    try {
      aiRawAnswer = await sendGigaChatRequest(
        finalMessagesPayload,
        400,
      )
    } catch (gigaError) {
      console.error(
        '⚠️ [Сбой сети GigaChat] Локальный фоллбек для Инвестора активирован:',
        gigaError.message,
      )
      // Генерируем реплику Эдуарда локально в зависимости от текущего стейта
      if (currentInterest < 40) {
        aiRawAnswer =
          'Слушай, это какая-то детская сказка, а не бизнес. Я не вижу здесь маржи. Покажи мне реальные боли клиентов или уходи. ###-10'
      } else if (currentInterest > 70) {
        aiRawAnswer =
          'А вот это уже пахнет хорошими иксами. С цифрами ты работать умеешь. Каковы ваши планы по выходу на международный рынок? ###+12'
      } else {
        aiRawAnswer =
          'Звучит неплохо, но УТП пока слабовато. Чем вы лучше китайских аналогов, которые скопируют вас за неделю? ###+5'
      }
    }

    // Парсим маркер изменения интереса инвестора (###+10 или ###-5)
    const interestMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const interestChange = interestMatch
      ? parseInt(interestMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // На всякий случай жесткая защита текста
    if (!cleanAnswer) {
      cleanAnswer = 'Я жду конкретных цифр и УТП. Не трать мое время.'
    }

    // Обновляем шкалу интереса в пределах 0-100
    let newInterest = currentInterest + interestChange
    newInterest = Math.min(Math.max(newInterest, 0), 100)

    // Сохраняем шаг в БД
    session.exerciseData.interest = newInterest
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Небольшой тайм-аут для имитации мышления ИИ
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(600)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      interest: newInterest,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Commercial Pitch Controller Error:', error.message)
    res.status(500).json({
      answer:
        'Инвестор прервал встречу из-за срочного звонка по другому проекту. (Ошибка сервера)',
    })
  }
}

const finishCommercialPitch = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Находим активную сессию для Сурового Инвестора
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-commercial-pitch',
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

    // Фильтруем пустые или безответные раунды
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если пользователь молчал — завершаем с нулем
    if (meaningfulMessages.length < 2) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы практически ничего не ответили инвестору. Презентовать стартап и привлечь финансирование не удалось.',
        criteria: { pain_match: 0, usp_clarity: 0, cta_structure: 0 },
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

    // Собираем стенограмму встречи
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Предприниматель' : 'Инвестор Эдуард'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт венчурного аналитика
    const EVALUATION_PROMPT = `Ты — суровый эксперт по венчурным инвестициям, стартап-консультант и мастер Elevator Pitch. Проанализируй стенограмму питча, где Пользователь (Предприниматель) презентовал бытовой предмет "${session.exerciseData.situation}" под видом инновационного бизнеса.

Оцени по 100-балльной шкале следующие критерии:
1. "Попадание в боль" (pain_match): Насколько четко пользователь выделил проблему целевой аудитории и обосновал ее критичность.
2. "Уникальность предложения" (usp_clarity): Удалось ли сформулировать понятное УТП (уникальное торговое предложение) для этого предмета и отстроиться от конкурентов/китайских фабрик.
3. "Призыв и структура" (cta_structure): Соблюдена ли логика бизнес-презентации, были ли названы цифры (доли, объемы рынка) и прозвучал ли внятный призыв к действию / оффер инвестору в финале.

Верни ответ СТРОГО в формате JSON без лишнего художественного текста или вводных слов вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая, язвительная, но конструктивная рецензия от инвестора Эдуарда на 2-3 предложения о качестве маркетинга и шансах стартапа выжить на рынке>",
  "criteria": {
    "pain_match": <число 0-100>,
    "usp_clarity": <число 0-100>,
    "cta_structure": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот протокол питч-сессии:\n${chatHistory}`,
        },
      ]
      const countTokens = 700
      const aiText = await sendGigaChatRequest(messages, countTokens)

      evaluation = parseAiResponse(aiText, {
        pain_match: 50,
        usp_clarity: 50,
        cta_structure: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Питча:',
        apiError.message,
      )
    }

    // Локальный фоллбек-безопасник, если сеть упала
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваша презентация сохранена на слайдах, но ИИ-аналитик не смог сформировать инвестиционный отчет из-за сбоя связи. Начислен базовый балл.',
        criteria: {
          pain_match: 50,
          usp_clarity: 50,
          cta_structure: 50,
        },
      }
    }

    // Обновляем статус сессии в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Начисляем опыт, монеты и обновляем статистику профиля
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-commercial-pitch',
      'Суровый Инвестор Эдуард',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Питча:', error)
    res.status(500).json({
      message:
        'Не удалось завершить упражнение Суровый Инвестор Эдуард',
    })
  }
}

export {
  startCommercialPitch,
  generatePitchResponse,
  finishCommercialPitch,
}
