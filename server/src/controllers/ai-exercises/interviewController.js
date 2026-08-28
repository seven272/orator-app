import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

const startInterview = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем приветсвенное сообщение от ИИ и первый вопрос
    const preview = `Я выступаю в роли ведущего. Тема нашего интервью "${exerciseData.topic}". Ваша роль "${exerciseData.role}". ${exerciseData.context} \n И мой первый вопрос...`

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
      message: `Ошибка сервера при старте упражнения Интервью`,
      error: error.message,
    })
  }
}

const generateInterviewResponse = async (req, res) => {
  try {
     let userMessage = null


    // Ищем сессию, созданную при старте дебатов
    let session = await AiExercise.findOne({
      userId: req.userId, 
      exerciseType: 'interview',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({
        message: 'Активная сессия не найдена. Начните сначала.',
      })
    }

     // Защита: извлекаем метаданные сценария напрямую из БД, не завязываясь на req.body при FormData
    const { role, topic, context } = session.exerciseData

     // 2. Если фронтенд прислал аудиозапись — мгновенно расшифровываем быстрым методом Сбера
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка синхронного SalutSpeech в интервью:', speechError)
        return res.status(500).json({
          message: 'Не удалось распознать вашу речь ведущего. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    // Считаем, сколько раз пользователь УЖЕ что-то отправлял (любое сообщение)
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 2 // Если это 3-й раз

   // Обработка пустого ответа или промалчивания
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim() || userMessage.includes('нечего сказать')) {
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

    const cleanUserMessage = userMessage.trim()

    const PROMPT = `Ты — опытный и язвительный ведущий. Берешь интервью у ${role} на тему "${topic}". Стало известно, что ${context}.
    Пользователь утверждает: "${cleanUserMessage}".
    Твоя задача: задай ОДИН провокационный вопрос.
    Вопрос должен быть коротким (2-4 предложения), острым, по теме.`

    // 4. Запрос к GigaChat
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    // Безопасное извлечение ответа GigaChat с указанием индекса [0] массива choices
    const aiAnswer = response.data.choices?.[0]?.message?.content

    if (!aiAnswer) {
      console.error('❌ [BACK-DEBUG] GigaChat вернул пустой ответ в интервью')
      throw new Error('Empty GigaChat response')
    }

    // cохраняем в историю чата в БД оба сообщения (в виде чистого текста)
    session.messages.push({
      role: 'user',
      text: cleanUserMessage,
    })
    session.messages.push({
      role: 'assistant',
      text: aiAnswer.trim(),
    })

    await session.save()

    // Имитация естественной паузы раздумий ИИ-ведущего телешоу
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const randomDelay = Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500
    await sleep(randomDelay)

    // Возвращаем фронтенду результат диалога
    return res.json({
      user_transcript: cleanUserMessage, 
      answer: aiAnswer.trim(),
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
    const userId = req.userId
    const { isDaily } = req.body

    // 1. Находим активную сессию
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'interview',
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

    let evaluation = null

    try {
      // Изолируем запрос к ИИ от сетевых сбросов ECONNRESET
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
      const aiJsonResult = response.data.choices[0].message.content

      // Вызываем универсальный парсер одной строкой
      evaluation = parseAiResponse(aiJsonResult, {
        toxicity: 30,
        diplomacy: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat (ECONNRESET) в Интервью:',
        apiError.message,
      )
    }

    // Аварийный выход на дефолты при сбое сети или парсинга
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваше интервью сохранено, но ИИ не смог сформировать детальный отчет из-за сбоя связи. Начислены базовые баллы.',
        criteria: {
          toxicity: 30,
          diplomacy: 50,
        },
      }
    }

    //  Обновляем сессию в БД
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria, // Map в схеме подхватит этот объект
    }

    await session.save()

    // Запуск сквозной геймификации, стриков и наград.
    // Передаем точный алиас с опечаткой 'ai-inrerview' для 100% совпадения со SKILLS_MAP!
    // Движок сам положит очки в exerciseStats, что динамически прокачает ветку "коммуникация"
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-interview',
      'Интервью с ИИ',
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
      .json({ message: 'Не удалось завершить упражнение Интервью' })
  }
}

export { startInterview, generateInterviewResponse, finishInterview }
