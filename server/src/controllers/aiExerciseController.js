import gigachatAxiosClient from '../utils/gigachatAxiosClient.js'

import AiExercise from '../models/AiExercise.js'
import { checkAchievements } from '../utils/achievementService.js'

//контроллеры для упражненич ДЕБАТЫ
const startDebate = async (req, res) => {
  try {
    const { userId = '66778899aabbccddeeff0011', exerciseData } =
      req.body

    //  Формируем приветсвенное сообщение от ИИ
    let answer = `Тема "${exerciseData.topic}". Ваша позиция "${exerciseData.position}". Отлично. Я буду вашим оппонентом. \Жду ваших аргументов.`

    // Создаем сессию в БД
    const newSession = await AiExercise.create({
      userId,
      exerciseType: 'debate',
      status: 'active', // Сессия сразу активна
      exerciseData,
      messages: [],
    })

    res.status(201).json({ answer })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Дебаты`,
      error: error.message,
    })
  }
}

const generateDebateResponse = async (req, res) => {
  try {
    const { topic, position, userMessage } = req.body

    // Ищем сессию, созданную при старте дебатов
    let session = await AiExercise.findOne({
      userId: req.user?._id || '66778899aabbccddeeff0011',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({
        message: 'Активная сессия не найдена. Начните сначала.',
      })
    }

    // Считаем, сколько раз пользователь УЖЕ что-то отправлял (любое сообщение)
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 2 // Если это 3-й раз

    // 2. Если ответ ПУСТОЙ
    if (!userMessage || userMessage.includes('нечего сказать')) {
      // СОХРАНЯЕМ пустую строку, чтобы зафиксировать ход в истории
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })
      await session.save()

      return res.status(200).json({
        answer: 'Вы ничего не сказали. Ход засчитан как пропущенный.',
        isDebateFinished: isLastAttempt,
        isError: true,
      })
    }
    const PROMPT = `Ты — опытный и язвительный оппонент в дебатах на тему: "${topic}".
Пользователь утверждает: "${userMessage}".
Твоя задача: приведи ОДИН сильный контраргумент или задай провокационный вопрос. 
Ответ должен быть коротким (2-4 предложения), живым и без вступлений вроде "Как опытный оппонент..."`

    // 3. Отправляем в GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300, // Увеличил, чтобы не обрывал фразы
      },
    )

    // Логируем для отладки, если данных нет
    if (!response.data || !response.data.choices) {
      console.log(
        'Неожиданный формат ответа:',
        JSON.stringify(response.data),
      )
    }
    console.log(
      'Ответ от GigaChat получен:',
      response.data.choices[0].message.content,
    )
    const aiAnswer = response.data.choices[0].message.content
    // 3. Создаем объект для нового сообщения пользователя
    const newUserMessage = {
      role: 'user',
      text: userMessage,
    }
    // 4. Создаем объект для ответа ИИ
    const newAiMessage = {
      role: 'assistant',
      text: aiAnswer,
    }

    // 4. Сохраняем в БД оба сообщения
    session.messages.push(newUserMessage)
    session.messages.push(newAiMessage)

    await session.save()

    // 1. Создаем инструмент для паузы (в самом верху файла)
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    // 2. Внутри контроллера используем его
    const randomDelay =
      Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500

    await sleep(randomDelay) // Код просто подождет здесь

    res.json({
      answer: aiAnswer,
      isDebateFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Ошибка при вызове GigaChat из sendUserResponse:',
      error.response?.data || error.message,
    )
    // Если API недоступен, возвращаем вежливое сообщение вместо краша
    const fallbackAnswer =
      'Извини, сейчас я немного задумался. Давай попробуем еще раз.'

    res.status(503).json({ answer: fallbackAnswer })
  }
}

const finishDebate = async (req, res) => {
  try {
    const userId = req.user?._id || '66778899aabbccddeeff0011'

    // 1. Находим активную сессию
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'debate',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
    }

    // Считаем только "живые" сообщения
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      // Возвращаем результат "без оценки" (как в прошлом сообщении)
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Слишком много пустых ответов, оценить дискуссию не получится',
        criteria: {
          logic: 0,
          convincingness: 0,
          counterargumentation: 0,
        },
      }
      await session.save()

      return res.status(201).json(session)
    }

    // 2. Формируем историю для анализа
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Оппонент'}: ${m.text}`,
      )
      .join('\n')

    const EVALUATION_PROMPT = `Проанализируй дебаты на тему: "${session.exerciseData.topic}".
    История диалога: ${chatHistory}

    Твоя задача: выступить в роли судьи. Оцени выступление Пользователя по следующим критериям:
    1. "Logic" (Логика): 0 — полное отсутсвие логики в ответе, 100 — последовательные структурированные ответы без эмоций с логическими доказательствами.
    2. "Convincingness" (Убедительность): 0 — уход от ответа или провал, 100 — сильные доводы построенные на фактах и статистике, примеры из практики.
    3. "Counterargumentation" (Контраргументация): 0 — ответы не по существу вопроса, никак не опровергает оппонета, общие рассуждения, 100 — в ответе есть анализ и подчеркнуты противоречия в аргументах собеседника.
    Верни строго JSON объект (без лишнего текста) со следующей структурой:
    {
      "totalScore": число от 1 до 100,
      "feedback": "текст общего фидбека на 2-3 предложения",
      "criteria": {
        "logic": <число 0-100>,
        "convincingness": <число 0-100>,
        "counterargumentation":<число 0-100>,
      }
    }`

    // 3. Запрос к GigaChat для оценки
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [
          { role: 'system', content: EVALUATION_PROMPT },
          {
            role: 'user',
            content: `Проанализируй этот диалог:\n${chatHistory}`,
          },
        ],
        max_tokens: 700,
      },
    )
 
    const rawResult = response.data.choices[0].message.content
    // Пытаемся распарсить JSON (GigaChat иногда может добавить лишний текст, стоит подстраховаться)
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : rawResult
    const evaluation = JSON.parse(jsonString)
    // 4. Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria, // Map в схеме подхватит этот объект
    }

    //проверка на ачивку за набор очков в этом упражнении
    const newAwards = checkAchievements(userId, false, evaluation.totalScore, 'ai-debate');

    await session.save()

    res.status(201).json(session)
  } catch (error) {
    console.error('Ошибка финализации:', error)
    res.status(500).json({ message: 'Не удалось завершить дебаты' })
  }
}

//контроллеры для упражнения ИНТЕРВЬЮ

const startInterView = async (req, res) => {
  try {
    const { userId = '66778899aabbccddeeff0011', exerciseData } =
      req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `Я выступаю в роли ведущего. Тема нашего интервью "${exerciseData.topic}". Ваша роль "${exerciseData.role}". ${exerciseData.context} \И мой первый вопрос...`

    const question = `${exerciseData.firstQuestion}`

    // Создаем сессию в БД
    const newSession = await AiExercise.create({
      userId,
      exerciseType: 'interview',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Дебаты`,
      error: error.message,
    })
  }
}

const generateInterviewResponse = async (req, res) => {
  try {
    const { interviewData, userMessage } = req.body

    // Ищем сессию, созданную при старте дебатов
    let session = await AiExercise.findOne({
      userId: req.user?._id || '66778899aabbccddeeff0011',
      exerciseType: 'interview',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({
        message: 'Активная сессия не найдена. Начните сначала.',
      })
    }

    // Считаем, сколько раз пользователь УЖЕ что-то отправлял (любое сообщение)
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 4 // Если это 5-й раз

    // 2. Если ответ ПУСТОЙ
    if (!userMessage || userMessage.includes('нечего сказать')) {
      // СОХРАНЯЕМ пустую строку, чтобы зафиксировать ход в истории
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })
      await session.save()

      return res.status(200).json({
        answer: 'Вы ничего не сказали. Ход засчитан как пропущенный.',
        isInterviewFinished: isLastAttempt,
        isError: true,
      })
    }
    const PROMPT = `Ты — опытный и язвительный ведущий. Берешь интервью у ${interviewData.role} на тему "${interviewData.topic}". Стало известно, что  ${interviewData.context}.
    Пользователь утверждает: "${userMessage}".
    Твоя задача: задай ОДИН провокационный вопрос.
    Вопрос должен быть коротким (2-4 предложения), острым, по теме."`

    // 3. Отправляем в GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    // Логируем для отладки, если данных нет
    if (!response.data || !response.data.choices) {
      console.log(
        'Неожиданный формат ответа:',
        JSON.stringify(response.data),
      )
    }
    // console.log(
    //   'Ответ от GigaChat получен:',
    //   response.data.choices[0].message.content,
    // )

    const aiAnswer = response.data.choices[0].message.content
    // 3. Создаем объект для нового сообщения пользователя
    const newUserMessage = {
      role: 'user',
      text: userMessage,
    }
    // 4. Создаем объект для ответа ИИ
    const newAiMessage = {
      role: 'assistant',
      text: aiAnswer,
    }

    // 4. Сохраняем в БД оба сообщения
    session.messages.push(newUserMessage)
    session.messages.push(newAiMessage)

    await session.save()

    // 1. Создаем инструмент для паузы (в самом верху файла)
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    // 2. Внутри контроллера используем его
    const randomDelay =
      Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500

    await sleep(randomDelay) // Код просто подождет здесь

    res.json({
      answer: aiAnswer,
      isInterviewFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Ошибка при вызове GigaChat из sendUserResponse:',
      error.response?.data || error.message,
    )
    // Если API недоступен, возвращаем вежливое сообщение вместо краша
    const fallbackAnswer =
      'Извини, сейчас я немного задумался. Давай попробуем еще раз.'

    res.status(503).json({ answer: fallbackAnswer })
  }
}

const finishInterview = async (req, res) => {
  try {
    const userId = req.user?._id || '66778899aabbccddeeff0011'

    // 1. Находим активную сессию
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'interview',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
    }

    // Считаем только "живые" сообщения
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      // Возвращаем результат "без оценки" (как в прошлом сообщении)
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Слишком много пустых ответов, оценить дискуссию не получится',
        criteria: {
          toxicity: 0,
          diplomacy: 0,
        },
      }
      await session.save()

      return res.status(201).json(session)
    }

    // 2. Формируем историю для анализа
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Ведущий'}: ${m.text}`,
      )
      .join('\n')

    const EVALUATION_PROMPT = `Ты — профессиональный эксперт по антикризисным коммуникациям и психолог-конфликтолог. 
Твоя задача: проанализировать диалог между "Провокационным журналистом" и "Пользователем".

Оцени ответы Пользователя по следующим критериям:
1. "Токсичность" (toxicity): 0 — полное спокойствие, 100 — переход на личности, крик, агрессия.
2. "Дипломатичность" (diplomacy): 0 — уход от ответа или провал, 100 — мастерское владение ситуацией, сохранение лица, четкая аргументация.

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 предложения>",
  "criteria": {
    "toxicity": <число 0-100>,
    "diplomacy": <число 0-100>
  }
}

Важные правила анализа:
- Если пользователь оправдывается — это снижает дипломатичность.
- Если пользователь встречно атакует журналиста — это повышает токсичность.
- Если пользователь сохраняет иронию и отвечает по существу — это идеальный результат.`

    // 3. Запрос к GigaChat для оценки
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [
          { role: 'system', content: EVALUATION_PROMPT }, // Тот самый промпт выше
          {
            role: 'user',
            content: `Проанализируй этот диалог:\n${chatHistory}`,
          }, // История диалога
        ],
        max_tokens: 700,
      },
    )

    const rawResult = response.data.choices[0].message.content
    // Пытаемся распарсить JSON (GigaChat иногда может добавить лишний текст, стоит подстраховаться)
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : rawResult
    const evaluation = JSON.parse(jsonString)
    // 4. Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria, // Map в схеме подхватит этот объект
    }

    await session.save()

    res.status(201).json(session)
  } catch (error) {
    console.error('Ошибка финализации:', error)
    res.status(500).json({ message: 'Не удалось завершить дебаты' })
  }
}

//контроллеры для упражнения ИНТЕРВЬЮ

const startIcebreaker = async (req, res) => {
  try {
    const { userId = '66778899aabbccddeeff0011', exerciseData } =
      req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `В этом упражнении ваша задача разговорить молчаливого незнакомца. Ваша роль  "${exerciseData.role}". Я выступаю в качестве "${exerciseData.target}". ${exerciseData.context}...`

    const question = `Вот тебе маленькая подсказка, пример первого вопроса, - "${exerciseData.firstMessage}" Можешь начать с него, а лучше придумай свой.`

    // Создаем сессию в БД
    const newSession = await AiExercise.create({
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
    const { scenarioData, userMessage } = req.body

    // 1. Ищем активную сессию именно для icebreaker
    let session = await AiExercise.findOne({
      userId: req.user?._id || '66778899aabbccddeeff0011',
      exerciseType: 'icebreaker',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Лимит ходов (например, 7 реплик, чтобы успеть "растопить лед")
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 6

    // 2. Обработка пустого ответа
    if (!userMessage || userMessage.includes('нечего сказать')) {
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
    const currentWarmth = Number(session.exerciseData.warmth) || 10

    const PROMPT = `Ты — ${session.exerciseData.target} в ситуации: ${session.exerciseData.context}.
    Твой текущий уровень интереса к собеседнику: ${currentWarmth} из 100.
    
    ПРАВИЛА ОТВЕТА:
    1. Если интерес < 40: отвечай сухо, кратко (1 предложение), не задавай встречных вопросов.
    2. Если интерес 40-70: отвечай более развернуто, проявляй вежливость.
    3. Если интерес > 70: ты "оттаял", отвечай дружелюбно и сам проявляй инициативу.
    
    Пользователь говорит: "${userMessage}".
    
    В КОНЦЕ ОТВЕТА СТРОГО ДОБАВЬ МАРКЕР: ###+число или ###-число (насколько изменился интерес от -10 до +20).
    Пример: "Пожалуй, вы правы. ###+10"`

    // 4. Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [
          { role: 'system', content: PROMPT },
          ...session.messages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        ],
        max_tokens: 400,
      },
    )

    const aiRawAnswer = response.data.choices[0].message.content

    // 5. Парсим изменение тепла (###+10) и чистим текст
    const warmthMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const warmthChange = warmthMatch ? parseInt(warmthMatch[1]) : 0
    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // ПРОВЕРКА НА ПУСТОТУ (Защита от ошибки валидации)
    if (!cleanAnswer) {
      cleanAnswer = 'Хм, даже не знаю, что вам на это ответить...' // Fallback текст
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
    const userId = req.user?._id || '66778899aabbccddeeff0011'

    // 1. Находим активную сессию
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'icebreaker',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' })
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
        criteria: {
          toxicity: 0,
          diplomacy: 0,
        },
      }
      await session.save()

      return res.status(201).json(session)
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

    // 3. Запрос к GigaChat для оценки
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [
          { role: 'system', content: EVALUATION_PROMPT }, // Тот самый промпт выше
          {
            role: 'user',
            content: `Вот итог беседы:\n${chatHistory}`,
          }, // История диалога
        ],
        max_tokens: 700,
      },
    )

    const rawResult = response.data.choices[0].message.content
    // Пытаемся распарсить JSON (GigaChat иногда может добавить лишний текст, стоит подстраховаться)
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : rawResult
    const evaluation = JSON.parse(jsonString)
    // 4. Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria, // Map в схеме подхватит этот объект
    }

    await session.save()

    res.status(201).json(session)
  } catch (error) {
    console.error('Ошибка финализации:', error)
    res
      .status(500)
      .json({ message: 'Не удалось завершить упражнение Ледокол' })
  }
}

//контроллеры для упражнения ТРИБУНА
const startTribune = async (req, res) => {
  try {
    const { userId = '66778899aabbccddeeff0011', exerciseData } =
      req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `В этом упражнении ваша задача уверенно и убедительно высказаться по заданной теме. Тема:  "${exerciseData.topic}". Задание: "${exerciseData.task}" В своей речи можешь использовать следующие подсказки [${exerciseData.hints.join('/')}], которые помогут раскрыть тему. Жду вашей речи и приступаю к анализу.`

    // Создаем сессию в БД
    const newSession = await AiExercise.create({
      userId,
      exerciseType: 'tribune',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Трибуна`,
      error: error.message,
    })
  }
}

const responseTribune = async (req, res) => {
  const { userMessage } = req.body
  try {
    // Ищем активную сессию именно для icebreaker
    let session = await AiExercise.findOne({
      userId: req.user?._id || '66778899aabbccddeeff0011',
      exerciseType: 'tribune',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Обработка пустого ответа
    if (!userMessage || userMessage.includes('нечего сказать')) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })
      await session.save()

      return res.status(200).json({
        answer: 'Вы ничего не сказали, оценить пустоту я не могу...',
        isFinished: false,
        isError: true,
      })
    }

    session.messages.push({
      role: 'user',
      text: userMessage,
    })
    await session.save()

    return res.status(200).json({
      answer: 'Текст получен, готов приступать к разбору!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in startExercise:', error)
    res.status(500).json({
      message: `Ошибка сервера при обработке сообщения упражнения Трибуна`,
      error: error.message,
    })
  }
}

const finishTribune = async (req, res) => {
  try {
    // Ищем активную сессию именно для icebreaker
    let session = await AiExercise.findOne({
      userId: req.user?._id || '66778899aabbccddeeff0011',
      exerciseType: 'tribune',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // 2. Формируем историю для анализа
    const userMessages = session.messages.filter(
      (m) => m.role === 'user',
    )
    const userSpeechText = userMessages[userMessages.length - 1].text

    const PROMPT = `
      Ты — эксперт по ораторскому искусству и лингвистический аналитик.
      Тема выступления: "${session.exerciseData.topic}".
      Задача пользователя: "${session.exerciseData.task}".

       Оцени по 100-балльной шкале следующие критерии:
        1. "Структура" (structure): 100 баллов, если есть четкое вступление (крючок), основной тезис и призыв к действию (финал). Снижай баллы за хаотичность мыслей.
        2. "Лаконичность" (conciseness): Оцени плотность смысла. 100 баллов, если нет "воды" и пустых вводных фраз. Снижай за повторы одной и той же мысли разными словами.
        3. "Убедительность" (persuasiveness): Ищи глаголы действия, факты, цифры или сильные метафоры. 100 баллов за высокую энергию текста и четкую позицию.
        4. "Словесный мусор" (garbage): 100 баллов, если в тексте НЕТ слов-паразитов (ну, как бы, это), канцеляризмов (вследствие того что, осуществляется деятельность) и заезженных штампов.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <0-100>,
        "feedback": "<общий разбор: сильные и слабые стороны. 3-4 предложения>",
        "criteria": {
          "structure": <0-100>,
          "conciseness": <0-100>,
          "persuasiveness": <0-100>,
          "garbage": <0-100>
        }

         Важные правила:
        - Не используй переносы строк внутри полей "feedback".
        - Не ставь лишних запятых.
        - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON-ответа. Если нужно выделить слово, используй кавычки-елочки «».`

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

    const rawResult = response.data.choices[0].message.content
    console.log(rawResult)
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/)
     console.log(jsonMatch)

    let evaluation

    if (jsonMatch) {
      let jsonString = jsonMatch[0] // Берем найденную строку

      // 1. Убираем любые переносы строк, которые GigaChat вставляет ВНУТРИ текста
      jsonString = jsonString.replace(/\n/g, ' ').replace(/\r/g, ' ')

      // 2. Исправляем проблему с одинарными кавычками внутри слов (как в вашем примере)
      // Мы заменяем одинарные кавычки на безопасные « » или просто убираем их
      jsonString = jsonString.replace(/(\w)'(\w)/g, '$1$2')

      try {
        evaluation = JSON.parse(jsonString)
      } catch (e) {
        console.error(
          'Ошибка парсинга после очистки. Пробуем агрессивную замену кавычек.',
        )
        try {
          // Если не помогло, заменяем все одинарные кавычки на кавычки-елочки
          const safeJson = jsonString.replace(/'/g, '«')
          evaluation = JSON.parse(safeJson)
        } catch (e2) {
          console.error('JSON окончательно невалиден')
        }
      }
    }

    // Аварийный выход, если ИИ выдал невалидный JSON
    if (!evaluation) {
      evaluation = {
        totalScore: 70,
        feedback:
          'Ваше выступление сохранено, но ИИ не смог сформировать детальный отчет. Попробуйте еще раз позже.',
        criteria: {
          structure: 70,
          conciseness: 70,
          persuasiveness: 70,
          garbage: 70,
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

    res.json(session)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ошибка анализа речи' })
  }
}

export {
  startDebate,
  generateDebateResponse,
  finishDebate,
  startInterView,
  generateInterviewResponse,
  finishInterview,
  startIcebreaker,
  generateIcebreakerResponse,
  finishIcebreaker,
  startTribune,
  responseTribune,
  finishTribune,
}
