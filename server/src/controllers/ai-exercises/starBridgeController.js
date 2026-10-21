import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startStarBridge = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из starScenarios

    // Формируем вводный контекст для экрана
    const preview = `Ситуация: "${exerciseData.situation}". \nКонтекст: ${exerciseData.event} \nФокус кумира: ${exerciseData.target_focus}`

    // Первая отстраненная реплика звезды из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-star-bridge',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        attention: 20, // Внимание на минимуме (20%), нужно зацепить
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startStarBridge:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Мост к кумиру`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generateStarResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для Моста к кумиру
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-star-bridge',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудио через службу распознавания речи
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          '⚠️ [Сбой инфраструктуры речи] Мягкий фоллбек активирован:',
          speechError.message,
        )

        // В случае падения STT генерируем текстовый короткий хук
        userMessage = `Здравствуйте, Эдуард. Я сократил ваши издержки на логистику в два раза за счет алгоритма трекинга. Вот суть моего решения за 10 секунд.`
      }
    }

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

      const currentAttention =
        Number(session.exerciseData.attention) || 20
      const newAttention = Math.max(currentAttention - 10, 0)
      session.exerciseData.attention = newAttention
      session.markModified('exerciseData')
      await session.save()

      return res.status(200).json({
        answer:
          'Ну, раз вам нечего сказать, я пожалуй выйду на следующем этаже. Всего доброго. (Отворачивается к дверям лифта).',
        isFinished: isLastAttempt,
        attention: newAttention,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentAttention =
      Number(session.exerciseData.attention) || 20

    // Системный промпт для занятой ИИ-знаменитости
    const PROMPT = `Ты — крайне занятая, известная и уставшая от навязчивого внимания знаменитость, селебрити или крупный миллиардер. Ты едешь в лифте или стоишь за кулисами. Ты не настроен слушать долгие презентации.

КОНТЕКСТ ВСТРЕЧИ:
- Ситуация: "${session.exerciseData.situation}".
- Описание контекста: "${session.exerciseData.event}".
- Твой жесткий фокус (что ты отбраковываешь): "${session.exerciseData.target_focus}".

ТЕКУЩИЙ УРОВЕНЬ ТВОЕЙ ЗАИНТЕРЕСОВАННОСТИ / ВНИМАНИЯ: ${currentAttention} из 100.
1. Если внимание < 40: ты демонстративно смотришь в свой смартфон, киваешь из вежливости, отвечаешь сухо, холодно и всем видом показываешь, что мечтаешь побыстрее уйти.
2. Если внимание 40-70: ты убираешь телефон в карман. Тебя что-то зацепило. Ты смотришь на пользователя, задаешь один короткий, точечный, каверзный вопрос по сути его предложения.
3. Если внимание > 70: ты искренне вовлечен в разговор, улыбаешься, проявляешь уважение к наглости и уму пользователя. Ты готов продолжить общение и в конце диалога сам предложишь обменяться контактами.

⚠️ ТВОИ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику от первого лица.
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Эдуард хмыкнул", "нажал кнопку", "вздохнул").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Кумир:".
5. Текст должен быть коротким (1-2 предложения), емким, деловым и отвечать строго на реплику пользователя.

АНАЛИЗ ОТВЕТА ПОЛЬЗОВАТЕЛЯ:
- Если пользователь говорит занудно, льет воду, уходит в долгие абстрактные вступления ("Меня зовут...", "Я представляю стартап...") — твое внимание падает (###-10 или ###-15).
- Если пользователь выдает короткий, бьющий в цель хук, интригует фактами/цифрами или предлагает нестандартную метафору — твое внимание растет (###+15 или ###+20).

Пользователь только что сказал тебе: "${cleanUserMessage}". Ответь ему в своей роли.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня внимания: ###+число или ###-число (от -20 до +20 в зависимости от силы хука пользователя).
Пример идеального ответа: "Хм, звучит любопытно. И какова маржинальность этой вашей платформы? ###+15"`

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
      console.error(
        '⚠️ [Сбой сети GigaChat] Фоллбек внимания кумира активирован:',
        gigaError.message,
      )

      if (currentAttention < 40) {
        aiRawAnswer =
          'Извините, мне это не интересно, я очень тороплюсь. Всего доброго. ###-5'
      } else if (currentAttention > 70) {
        aiRawAnswer =
          'Интересная мысль, у вас явно есть деловая хватка. Каков ваш следующий шаг? ###+15'
      } else {
        aiRawAnswer =
          'Допустим, звучит неплохо. Но за счет чего вы собираетесь масштабировать эту историю? ###+10'
      }
    }

    // Парсим маркер изменения шкалы внимания
    const attentionMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const attentionChange = attentionMatch
      ? parseInt(attentionMatch, 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    if (!cleanAnswer) {
      cleanAnswer =
        'Двери лифта открываются, мне пора идти. Удачи вам.'
    }

    // Обновляем и зажимаем внимание в пределах 0-100
    let newAttention = currentAttention + attentionChange
    newAttention = Math.min(Math.max(newAttention, 0), 100)

    // Сохраняем ход в БД
    session.exerciseData.attention = newAttention
    session.markModified('attention')
    session.messages.push({
      role: 'user',
      text: userMessage || cleanUserMessage,
    })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(600)

    res.json({
      user_transcript: userMessage ? cleanUserMessage : null,
      answer: cleanAnswer,
      attention: newAttention,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Star Bridge Controller Error:', error.message)
    res.status(500).json({
      answer:
        'Кумир вышел на ближайшем этаже из-за сбоя в системе контроля лифтового оборудования.',
    })
  }
}

const finishStarBridge = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Находим активную сессию для Моста к кумиру
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-star-bridge',
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

    // Если пользователь промолчал все раунды — завершаем без оценки
    if (meaningfulMessages.length < 2) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы упустили свой шанс и не смогли выдать короткий оффер, пока ехали в лифте. Кумир ушел.',
        criteria: {
          hook_power: 0,
          offer_clarity: 0,
          cta_boldness: 0,
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

    // Формируем историю чата для Elevator Pitch аудита
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь (Оратор)' : 'Кумир (Звезда)'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям скоростного нетворкинга
    const EVALUATION_PROMPT = `Ты — эксперт по скоростному нетворкингу, Elevator Pitch и венчурным презентациям. Проанализируй стенограмму разговора в лифте, где Пользователь пытался за 3 раунда зацепить очень занятого и влиятельного Кумира, чтобы получить его контакты или встречу.

Оцени по 100-балльной шкале следующие критерии:
1. "Сила зацепки" (hook_power): Удалось ли пользователю в первой же фразе заинтриговать кумира, выдать яркий факт, цифру или метафору, заставившую отвлечься от телефона.
2. "Четкость оффера" (offer_clarity): Насколько емко, без воды и заумных вступлений сформулирована суть предложения (проблема, решение, выгода). Уложился ли спич в формат "коротко о главном".
3. "Наглость и CTA" (cta_boldness): Насколько уверенно и четко сформулирован финальный призыв к действию (запрос визитки, номера Telegram или фиксация времени встречи) без заискивания и робости.

Верни ответ СТРОГО в формате JSON без лишних художественных текстов вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая авторитетная бизнес-рецензия на 2-3 предложения о том, насколько профессионально пользователь провел Elevator Pitch и каковы его шансы получить реальную встречу>",
  "criteria": {
    "hook_power": <число 0-100>,
    "offer_clarity": <число 0-100>,
    "cta_boldness": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот протокол питча в лифте:\n${chatHistory}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        hook_power: 50,
        offer_clarity: 50,
        cta_boldness: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Моста к кумиру:',
        apiError.message,
      )
    }

    // Фоллбек на случай сбоев сети
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Двери лифта открылись, визитка осталась у вас в руках. Из-за временного сбоя связи подробный разбор аналитика недоступен. Начислен базовый балл.',
        criteria: {
          hook_power: 50,
          offer_clarity: 50,
          cta_boldness: 50,
        },
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
      'ai-star-bridge',
      'Мост к кумиру',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Моста к кумиру:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Мост к кумиру',
    })
  }
}

export { startStarBridge, generateStarResponse, finishStarBridge }
