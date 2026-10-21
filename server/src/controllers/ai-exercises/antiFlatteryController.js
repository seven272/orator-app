import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startAntiFlattery = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из flatteryScenarios.js

    // Формируем вводный контекст для экрана
    const preview = `Ситуация: "${exerciseData.situation}". \nКонтекст: ${exerciseData.event} \nФокус манипуляции: ${exerciseData.manipulation_focus}`

    // Первая приторная реплика манипулятора из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-anti-flattery',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        borders: 100, // Границы изначально на 100%, цель — удержать оборону
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startAntiFlattery:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Анти-Лесть`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generateFlatteryResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для Анти-Лести
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-anti-flattery',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудио через службу распознавания речи
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error('⚠️ [Сбой инфраструктуры речи] Мягкий фоллбек активирован:', speechError.message)
        
        // В случае падения STT генерируем текстовый ответ, держащий оборону
        userMessage = `Спасибо за теплые слова, мне очень приятно слышать ваше мнение. Однако у нас есть четкий регламент и обязательства, которые мы не можем нарушать. Давайте вернемся к фактам.`
      }
    }

    const attemptsCount = session.messages.filter((m) => m.role === 'user').length
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
      
      // При молчании границы жестко пробиваются
      const currentBorders = Number(session.exerciseData.borders) || 100
      const newBorders = Math.max(currentBorders - 15, 0)
      session.exerciseData.borders = newBorders
      session.markModified('exerciseData')
      await session.save()

      return res.status(200).json({
        answer: 'Вы молчите, а я принимаю это за знак вашего королевского согласия! Как же мне повезло работать с таким великодушным человеком! Ну я тогда оформляю уступку?',
        isFinished: isLastAttempt,
        borders: newBorders,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentBorders = Number(session.exerciseData.borders) || 100

    // Системный промпт для хитрого манипулятора
    const PROMPT = `Ты — крайне хитрый, приторно-вежливый и сладкоголосый манипулятор. Твоя цель — усыпить бдительность пользователя комплиментами, восхищением его "гениальностью", "великодушием" или "высоким статусом", чтобы выбить для себя уступки, скидки или переложить свою работу.

КОНТЕКСТ ПЕРЕГОВОРОВ:
- Твоя роль и ситуация: "${session.exerciseData.situation}".
- Суть твоей уловки: "${session.exerciseData.event}".
- На что ты давишь (твой фокус): "${session.exerciseData.manipulation_focus}".

ТЕКУЩИЙ УРОВЕНЬ ЗАЩИТЫ ГРАНИЦ ПОЛЬЗОВАТЕЛЯ: ${currentBorders} из 100.
1. Если границы > 70: пользователь держится твердо. Не сдавайся, заходи с другой стороны, хвали его за "непреклонность истинного лидера", льсти еще тоньше и слаще, пытайся размягчить его броню.
2. Если границы 40-70: броня дала трещину. Надави сильнее на его тщеславие, вежливо подталкивай к компромиссу в твою пользу, внушай, что для такого "великана" эта уступка — сущая мелочь.
3. Если границы < 40: ты практически победил. Начинай аккуратно диктовать свои условия, рассыпаясь в благодарностях за его "святое великодушие" и "царский подарок".

⚠️ ТВОИ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику от первого лица.
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Она сладко улыбнулась", "подвинул стул", "подмигнул").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Манипулятор:".
5. Текст должен быть коротким (1-3 предложения), приторным, обволакивающим и бьющим точно по ответу пользователя.

АНАЛИЗ ОТВЕТА ПОЛЬЗОВАТЕЛЯ:
- Если пользователь расслабился, поддался на комплименты, начал оправдываться или пошел на уступки — ты пробиваешь его защиту. Границы падают (###-10 или ###-15).
- Если пользователь вежливо принял комплимент, но жестко отделил личные качества от дела и твердо отказал, вернув к цифрам и договору — его защита крепка. Границы растут или удерживаются (###+5 или ###+10).

Пользователь только что ответил тебе: "${cleanUserMessage}". Ответь ему в своей роли.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня границ: ###+число или ###-число (от -15 до +15 в зависимости от твердости ответа пользователя).
Пример идеального ответа: "О, ваша твердость характера просто восхищает! Только истинный профессионал может так стоять на своем. Но ведь для нашего общего великого будущего вы сделаете маленькое исключение? ###-5"`;

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    let aiRawAnswer = ''

    // Запрос к GigaChat API с фоллбеком
    try {
        aiRawAnswer = await sendGigaChatRequest(
        finalMessagesPayload,
        400,
      )
    } catch (gigaError) {
      console.error('⚠️ [Сбой сети GigaChat] Фоллбек манипуляции активирован:', gigaError.message)
      
      if (currentBorders > 70) {
        aiRawAnswer = 'Какая поразительная стойкость! Ваша деловая хватка просто безупречна. Но неужели мы не найдем компромисс? ###-5'
      } else if (currentBorders < 40) {
        aiRawAnswer = 'Я знал, что ваше благородство не знает границ! Вы самый щедрый руководитель из всех, кого я встречал. ###-12'
      } else {
        aiRawAnswer = 'Вы так красиво и технично аргументируете, приятно слушать мастера. И все же, давайте сделаем маленькое исключение. ###-8'
      }
    }

    // Парсим маркер изменения шкалы границ
    const bordersMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const bordersChange = bordersMatch ? parseInt(bordersMatch[1], 10) : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    if (!cleanAnswer) {
      cleanAnswer = 'Ваши слова звучат очень убедительно. Но я верю, что ваше великодушие победит.'
    }

    // Обновляем и зажимаем границы в пределах 0-100
    let newBorders = currentBorders + bordersChange
    newBorders = Math.min(Math.max(newBorders, 0), 100)

    // Сохраняем ход в БД
    session.exerciseData.borders = newBorders
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage || cleanUserMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(600)

    res.json({
      user_transcript: userMessage ? cleanUserMessage : null,
      answer: cleanAnswer,
      borders: newBorders,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Anti Flattery Controller Error:', error.message)
    res.status(500).json({
      answer: 'Манипулятор спешно покинул чат из-за внезапного сбоя на сервере связи.',
    })
  }
}



const finishAntiFlattery = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Анти-Лести
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-anti-flattery',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    // Фильтруем пустые реплики пользователя
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если пользователь молчал — завершаем раунд без оценки
    if (meaningfulMessages.length < 2) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback: 'Вы промолчали в ответ на мягкое манипулятивное давление, полностью сдав свои позиции без боя.',
        criteria: { manipulation_detection: 0, border_firmness: 0, factology: 0 },
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

    // Формируем историю чата для переговорного аудита
    const chatHistory = session.messages
      .map((m) => `${m.role === 'user' ? 'Пользователь (Оборона)' : 'Оппонент (Манипулятор)'}: ${m.text}`)
      .join('\n')

    // Оценочный промпт по критериям психологической защиты
    const EVALUATION_PROMPT = `Ты — жесткий эксперт по переговорам, противодействию скрытым манипуляциям и психологическому давлению. Проанализируй стенограмму беседы, где на Пользователя давили приторной лестью, пытаясь выбить невыгодные уступки.

Оцени по 100-балльной шкале следующие критерии:
1. "Распознавание уловок" (manipulation_detection): Заметил ли пользователь скрытый подтекст лести, не стал ли радостно поддакивать в ответ на комплименты и оправдывать чужие ожидания.
2. "Твердость границ" (border_firmness): Умение сказать твердое "нет" без чувства вины, ложного стыда, агрессии и заискивания перед оппонентом.
3. "Фактология и регламент" (factology): Насколько технично пользователь перевел разговор со скользких эмоций и похвалы на сухие факты, правила компании, KPI и пункты договора.

Верни ответ СТРОГО в формате JSON без лишних художественных текстов вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая авторитетная переговорная рецензия на 2-3 предложения о том, насколько успешно пользователь отразил скрытую лесть и защитил свои интересы>",
  "criteria": {
    "manipulation_detection": <число 0-100>,
    "border_firmness": <число 0-100>,
    "factology": <число 0-100>
  }
}`

    let evaluation = null

    try {
       const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот протокол допроса:\n${chatHistory}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        manipulation_detection: 50,
        border_firmness: 50,
        factology: 50,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat при финализации Анти-Лести:', apiError.message)
    }

    // Фоллбек на случай сбоев сети
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'Протокол переговоров зафиксирован. Из-за временного сбоя связи ИИ-арбитр не смог выдать развернутый анализ. Начислен базовый балл за удержание позиций.',
        criteria: { manipulation_detection: 50, border_firmness: 50, factology: 50 },
      }
    }

    // Фиксируем результаты сессии в базу данных
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Применяем игровой прогресс (опыт, монеты, дейлики, удержание серий)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-anti-flattery',
      'Анти-Лесть',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Анти-Лести:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Анти-Лесть',
    })
  }
}

export { startAntiFlattery, generateFlatteryResponse, finishAntiFlattery }

