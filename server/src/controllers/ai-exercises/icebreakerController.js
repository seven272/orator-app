import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

const startIcebreaker = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `В этом упражнении ваша задача разговорить молчаливого незнакомца. Ваша роль  "${exerciseData.role}". Я выступаю в качестве "${exerciseData.target}". ${exerciseData.context}...`

    const question = `Вот тебе маленькая подсказка, пример первого вопроса, - "${exerciseData.firstMessage}" Можешь начать с него, а лучше придумай свой.`

    // Создаем сессию в БД 
    await AiExercise.create({
      userId,
      exerciseType: 'icebreaker',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Ледокол`,
      error: error.message,
    })
  }
}

const generateIcebreakerResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // 1. Ищем активную сессию именно для icebreaker
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'icebreaker',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // 2. Если фронтенд прислал аудиозапись — мгновенно расшифровываем её быстрым методом Сбера
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка синхронного SalutSpeech в ледоколе:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    // Лимит ходов (например, 7 реплик, чтобы успеть "растопить лед")
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 6

    // 3. Обработка пустого ответа или промалчивания
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
        answer: 'Вы молчите, так разговор не завяжется...',
        isFinished: isLastAttempt,
        warmth: session.exerciseData.warmth,
        isError: true,
      })
    }

    // 3. Формируем PROMPT для "холодного" собеседника
    const cleanUserMessage = userMessage.trim()
    const currentWarmth = Number(session.exerciseData.warmth) || 10

     const PROMPT = `Ты — ${session.exerciseData.target} в ситуации: ${session.exerciseData.context}.
    Твой текущий уровень интереса к собеседнику: ${currentWarmth} из 100.
    
    ПРАВИЛА ОТВЕТА:
    1. Если интерес < 40: отвечай сухо, кратко (1 предложение), не задавай встречных вопросов.
    2. Если интерес 40-70: отвечай более развернуто, проявляй вежливость.
    3. Если интерес > 70: ты "оттаял", отвечай дружелюбно и сам проявляй инициативу.
    
    Пользователь говорит: "${cleanUserMessage}".
    
    ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО: Твой ответ ОБЯЗАТЕЛЬНО должен содержать текст реплики (минимум 1 предложение). ЗАПРЕЩЕНО присылать только маркер!
    В САМОМ КОНЦЕ ответа строго добавь маркер: ###+число или ###-число (изменение от -10 до +20).
    Пример правильного ответа: "Пожалуй, вы правы. ###+10"`

  
    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content, // Защита: берем m.text из вашей БД
      })),
    ]



    // 4. Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: finalMessagesPayload,
        max_tokens: 400,
      },
    )

    

    // Безопасное извлечение ответа с указанием индекса массива choices
    const aiRawAnswer = response.data?.choices?.[0]?.message?.content
  
    // 5. Парсим изменение тепла (###+10) и чистим текст
    const warmthMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const warmthChange = warmthMatch
      ? parseInt(warmthMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // ПРОВЕРКА НА ПУСТОТУ (Защита от ошибки валидации)
    // 💡 ИСПРАВЛЕНИЕ ФОЛЛБЕКА: Если GigaChat схалтурил и прислал только маркер (пустой текст),
    // мы подставляем живой человеческий ответ в зависимости от того, потеплел собеседник или похолодел
    if (!cleanAnswer) {
      if (warmthChange > 0) {
        cleanAnswer = 'Мм, в этом определенно что-то есть...'
      } else if (warmthChange < 0) {
        cleanAnswer = 'Хм, даже не знаю, что вам на это ответить...'
      } else {
        cleanAnswer = 'Ясно. Что еще предложите?'
      }
    }
   
    // Обновляем шкалу
    let newWarmth = currentWarmth + warmthChange
    newWarmth = Math.min(Math.max(newWarmth, 0), 100)

    // 6. Сохраняем прогресс
    session.exerciseData.warmth = newWarmth
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    // Если лед растоплен до финала — можно пометить как завершенное
    if (newWarmth >= 100) session.status = 'completed'

    await session.save()

    // Имитация раздумий ИИ
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1000)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      warmth: newWarmth,
      isFinished: isLastAttempt || newWarmth >= 100,
    })
  } catch (error) {
    console.error(
      'Icebreaker AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer: 'Собеседник отвернулся и замолчал... (Ошибка связи)',
    })
  }
}

const finishIcebreaker = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // 1. Находим активную сессию
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'icebreaker',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
    }

    // Загружаем полный документ пользователя
    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Считаем только "живые" сообщения
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 3) {
      // Возвращаем результат "без оценки" (как в прошлом сообщении)
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Слишком много пустых ответов, оценить дискуссию не получится',
        criteria: { empathy: 0, openness: 0, initiative: 0 },
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

    // 2. Формируем историю для анализа
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Собеседник'}: ${m.text}`,
      )
      .join('\n')

    const EVALUATION_PROMPT = `Ты — эксперт по социальным коммуникациям. Проанализируй диалог, где Пользователь пытался завязать знакомство и "растопить лед".

Оцени по 100-балльной шкале следующие критерии:
1. "Эмпатия" (empathy): Умение слушать и реагировать на слова собеседника. 
2. "Открытость" (openness): использование открытых вопросов вместо закрытых "да/нет".
3. "Инициативность" (initiative): находчивость в поиске новых тем. 

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 предложения над чем поработать>",
  "criteria": {
    "empathy": <число 0-100>,
    "openness": <число 0-100>,
    "initiative": <число 0-100>,
  }
}`

    let evaluation = null

    try {
      // сетевой запрос к Сберу
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: EVALUATION_PROMPT },
            {
              role: 'user',
              content: `Вот итог беседы:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )
      const aiJsonResult = response.data.choices[0].message.content
      // Парсим ответ универсальной утилитой под критерии Ледокола
      evaluation = parseAiResponse(aiJsonResult, {
        empathy: 50,
        openness: 50,
        initiative: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat (ECONNRESET) в Ледоколе:',
        apiError.message,
      )
    }

    // Железобетонный аварийный выход при любых проблемах со связью
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваше выступление сохранено, но ИИ не смог сформировать детальный отчет из-за сбоя связи. Начислены базовые баллы.',
        criteria: {
          empathy: 50,
          openness: 50,
          initiative: 50,
        },
      }
    }

    // 4. Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }
    await session.save()

    // Передаем управление нашему движку геймификации.
    // Передаем алиас 'ai-icebreaker' и название тренажера.
    // Движок сам обновит статистику в User, что прокачает категорию "коммуникация" по SKILLS_MAP!
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-icebreaker',
      'Ледокол',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации:', error)
    res
      .status(500)
      .json({ message: 'Не удалось завершить упражнение Ледокол' })
  }
}

export {
  startIcebreaker,
  generateIcebreakerResponse,
  finishIcebreaker,
}
