import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startBargain = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем вводный контекст для экрана переговоров
    const preview = `Вы торгуетесь за товар/услугу. Ситуация: "${exerciseData.situation}". Предмет сделки: "${exerciseData.item}". Позиция продавца: ${exerciseData.seller_focus}`

    // Первая реплика упрямого продавца берется напрямую из настроек сценария
    const question = exerciseData.init_phrase

    await AiExercise.create({
      userId,
      exerciseType: 'bargain',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        currentPrice: Number(exerciseData.initial_price), // Начальная цена сделки
        targetPrice: Number(exerciseData.target_price), // Желаемая цена для пользователя
      },
      messages: [],
    })

    res.status(201).json({
      preview,
      question,
      initialPrice: Number(exerciseData.initial_price),
      targetPrice: Number(exerciseData.target_price),
    })
  } catch (error) {
    console.error('Error in startBargain:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Торг уместен`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (РЕПЛИКА И СКИДКА)
const generateBargainResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для bargain
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'bargain',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Расшифровка аудио через SaluteSpeech
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка синхронного SaluteSpeech в торге:',
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
    const isLastAttempt = attemptsCount >= 2 // Ограничение в 3 раунда (индексы 0, 1, 2)

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
          'Вы молчите... Раз не предлагаете свои условия, значит согласны на мою изначальную цену. Берете?',
        isFinished: isLastAttempt,
        currentPrice: session.exerciseData.currentPrice,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentPrice = Number(session.exerciseData.currentPrice)
    const targetPrice = Number(session.exerciseData.targetPrice)

    const PROMPT = `Ты — упрямый, хитрый и прагматичный продавец. Твоя цель — продать товар как можно дороже, но ты готов уступать в цене, если пользователь приводит сильные, весомые аргументы (указывает на дефекты, предлагает большой объем, давит на срочность или альтернативы).

КОНТЕКСТ СДЕЛКИ:
- Ситуация: "${session.exerciseData.situation}".
- Предмет торга: "${session.exerciseData.item}".
- ТВОЙ ФОКУС И АРГУМЕНТЫ: "${session.exerciseData.seller_focus}". Твердо стой на своем качестве, уникальности или востребованности.

ТЕКУЩАЯ СТОИМОСТЬ ТОВАРА: ${currentPrice} руб.
ЦЕЛЕВАЯ СТОИМОСТЬ (ниже которой ты не опустишься): ${targetPrice} руб.

ПОВЕДЕНИЕ:
1. Если аргументы пользователя слабые ("ну сделайте скидочку плиз"), цену не снижай или снижай символически, ворчи и требуй факты.
2. Если аргументы сильные и логичные — неохотно иди на уступки, сбивая цену ближе к целевой.
3. Чем ближе цена к ${targetPrice}, тем жестче сопротивляйся. Запрещено падать ниже ${targetPrice}.

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику продавца от первого лица. 
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Продавец вздохнул", "потер руки", "нахмурился").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Продавец:".
5. Текст должен быть коротким (1-3 предложения), емким и отвечать на доводы пользователя.

Пользователь только что сказал: "${cleanUserMessage}". Ответь ему как продавец.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения итоговой стоимости: ###-число или ###-0 если скидку не даешь. Размер скидки определяй по силе аргумента (например, ###-15000 или ###-50000). Пиши строго общую скидку, на которую снижаешь текущую цену.
Пример идеального ответа: "Ну хорошо, раз вы заберете машину прямо сегодня без осмотра в сервисе, я готов скинуть немного. Забирайте за миллион четыреста. ###-100000"`

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

    // Парсим сумму, на которую ИИ снизил цену (###-50000)
    const priceMatch = aiRawAnswer.match(/###\s?-\s?(\d+)/)
    const priceDiscount = priceMatch ? parseInt(priceMatch[1], 10) : 0

    let cleanAnswer = aiRawAnswer
      .replace(/###\s?-\s?\d+/, '')
      .replace(/###\s?0/, '')
      .trim()

    // Защитный фоллбек, если ИИ вернул пустой текст
    if (!cleanAnswer) {
      if (priceDiscount > 0) {
        cleanAnswer =
          'Ладно, ваша взяла. Уступлю еще немного, но это последнее предложение.'
      } else {
        cleanAnswer =
          'Ваши аргументы меня не убедили. Цена остается прежней.'
      }
    }

    // Рассчитываем новую цену, следя, чтобы она не упала ниже лимита (targetPrice)
    let newPrice = currentPrice - priceDiscount
    if (newPrice < targetPrice) {
      newPrice = targetPrice
    }

    // Сохраняем шаг в БД
    session.exerciseData.currentPrice = newPrice
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
      currentPrice: newPrice,
      isFinished: isLastAttempt || newPrice <= targetPrice, // Финиш, если раунды кончились или достигли идеальной цены
    })
  } catch (error) {
    console.error(
      'Bargain AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer:
        'Продавец отошел ответить на другой звонок. Связь оборвалась. (Ошибка связи)',
    })
  }
}

// 3. ФИЛИАЛИЗАЦИЯ И ОЦЕНКА
const finishBargain = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'bargain',
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
          'Вы не привели аргументов для снижения цены, торг провален.',
        criteria: { manipulation: 0, benefits: 0, flexibility: 0 },
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
          `${m.role === 'user' ? 'Покупатель' : 'Продавец'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям жестких переговоров и торга
    const EVALUATION_PROMPT = `Ты — эксперт по коммерческим переговорам, закупкам и жесткому торгу. Проанализируй стенограмму торгов, где Пользователь (Покупатель) пытался сбить цену у продавца.

Оцени по 100-балльной шкале следующие критерии:
1. "Работа со свойствами и выгодой" (benefits): Насколько грамотно пользователь подсвечивал минусы товара, объемы закупки или выгоду для продавца.
2. "Твердость и гибкость" (flexibility): Умение держать позицию, не соглашаться на первое предложение, но и не уходить в глухой деструктивный конфликт.
3. "Манипуляция и психологическое давление" (manipulation): Использование техник ограничения времени, дефицита, альтернативных предложений конкурентов.

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 предложения о том, какие сильные и слабые стороны были в тактике торга пользователя>",
  "criteria": {
    "benefits": <число 0-100>,
    "flexibility": <число 0-100>,
    "manipulation": <число 0-100>
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
              content: `Вот протокол коммерческого торга:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        benefits: 50,
        flexibility: 50,
        manipulation: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в Торг уместен:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Параметры сделки зафиксированы. Аналитический модуль оценки недоступен из-за проблем со связью, начислен средний балл.',
        criteria: { benefits: 50, flexibility: 50, manipulation: 50 },
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
      'ai-bargain',
      'Торг уместен',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации торга:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Торг уместен',
    })
  }
}

export { startBargain, generateBargainResponse, finishBargain }
