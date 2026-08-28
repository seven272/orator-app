import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startMetaphor = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем вводный контекст для экрана
    const preview = `Упражнение «Трудный переводчик». Ваша цель: объяснить термин "${exerciseData.term}". Ваша аудитория: ${exerciseData.target_audience} Ограничение: ${exerciseData.constraint}`

    // Первая реплика капризного или непонимающего персонажа берется из настроек сценария
    const question = exerciseData.init_phrase

    await AiExercise.create({
      userId,
      exerciseType: 'metaphor',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        understanding: 0, // Стартовое понимание на нуле — ИИ пока ничего не понимает
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startMetaphor:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Трудный переводчик`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ОБЪЯСНЕНИЕ ТЕРМИНА И РЕАКЦИЯ)
const generateMetaphorResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для metaphor
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'metaphor',
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
        console.error('Ошибка синхронного SaluteSpeech в переводчике:', speechError)
        return res.status(500).json({
          message: 'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    const attemptsCount = session.messages.filter((m) => m.role === 'user').length
    const isLastAttempt = attemptsCount >= 2 // Ограничение в 3 раунда

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
        answer: 'Ну и почему ты молчишь? Я жду объяснений! Давай, подбирай слова, я всё ещё ничего не понимаю!',
        isFinished: isLastAttempt,
        understanding: session.exerciseData.understanding,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentUnderstanding = Number(session.exerciseData.understanding) || 0

    const PROMPT = `Ты — специфический, капризный или далекий от технологий персонаж. Ты абсолютно не знаешь современных научных и технических терминов. 
Сейчас пользователь пытается объяснить тебе сложный термин, подстраиваясь под твое мышление.

ТВОЙ ПЕРСОНАЖ И КОНТЕКСТ:
- Термин, который тебе объясняют: "${session.exerciseData.term}".
- Кто ты (твоя роль и целевая аудитория): "${session.exerciseData.target_audience}".
- ЖЕСТКОЕ ОГРАНИЧЕНИЕ ДЛЯ ПОЛЬЗОВАТЕЛЯ: "${session.exerciseData.constraint}". Он должен использовать только понятные тебе метафоры.

ТЕКУЩИЙ УРОВЕНЬ ТВОЕГО ПОНИМАНИЯ: ${currentUnderstanding} из 100.
1. Если понимание < 30: ты в полном недоумении, злишься, пугаешься или считаешь слова пользователя бредом. Потребуй объяснить еще проще.
2. Если понимание 30-70: до тебя начинает доходить суть, но отдельные моменты все еще смущают. Задавай уточняющие вопросы, цепляясь за его метафоры.
3. Если понимание > 70: ты почти всё понял! Восхитись находчивостью пользователя, но задай финальный вопрос для закрепления.

ПРАВИЛА ОЦЕНКИ НАХОДЧИВОСТИ:
Если пользователь использует сложные абстрактные слова (например, "децентрализованный", "компиляция", "сервер", "алгоритм"), ты сердишься, говоришь, что это "птичий язык", и уровень понимания падает (###-число).
Если пользователь проявил находчивость и круто перевел абстракцию на понятный тебе язык (морской, кулинарный, бытовой) — уровень понимания растет (###+число).

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику персонажа от первого лица. 
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Бабушка перекрестилась", "Шеф-повар швырнул нож").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя.
4. Никаких описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Бабушка:".
5. Текст должен быть коротким (1-3 предложения), емким и отражать твою ментальность.

Пользователь только что сказал: "${cleanUserMessage}". Ответь ему в своей роли.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения твоего уровня понимания: ###+число или ###-число (от -15 до +15 в зависимости от находчивости и простоты метафоры пользователя).
Пример идеального ответа: "А-а-а, так этот твой блокчейн — это как наш пиратский судовой журнал, который хранится у каждого матроса, и страницу оттуда тайно не вырвать? Ну теперь до меня доходит! А как из этого журнала долю в золоте получить? ###+12"`

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

    // Парсим изменение понимания (###+12)
    const understandingMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const understandingChange = understandingMatch ? parseInt(understandingMatch[1], 10) : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Защитный фоллбек
    if (!cleanAnswer) {
      if (understandingChange > 0) {
        cleanAnswer = 'Кажется, я начинаю что-то понимать. Продолжай в том же духе!'
      } else {
        cleanAnswer = 'Ничего не понимаю из того, что ты говоришь. Изъясняйся проще!'
      }
    }

    // Обновляем шкалу в пределах 0-100
    let newUnderstanding = currentUnderstanding + understandingChange
    newUnderstanding = Math.min(Math.max(newUnderstanding, 0), 100)

    // Сохраняем шаг в БД
    session.exerciseData.understanding = newUnderstanding
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Имитация раздумий персонажа
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1000)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      understanding: newUnderstanding,
      isFinished: isLastAttempt || newUnderstanding >= 95, // Заканчиваем досрочно, если полное понимание
    })
  } catch (error) {
    console.error('Metaphor AI Error:', error.response?.data || error.message)
    res.status(503).json({
      answer: 'Собеседник отвлекся и перестал вас слушать из-за сильного шума вокруг. (Ошибка связи)',
    })
  }
}

// 3. ФИЛИАЛИЗАЦИЯ И ОЦЕНКА ПЕРЕВОДА
const finishMetaphor = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'metaphor',
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
        feedback: 'Вы дали слишком короткие или размытые ответы. Объяснить сложный термин не удалось.',
        criteria: { accuracy: 0, simplicity: 0, adaptability: 0 },
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
          `${m.role === 'user' ? 'Объясняющий (Пользователь)' : 'Собеседник (ИИ)'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям ораторского искусства и находчивости
    const EVALUATION_PROMPT = `Ты — эксперт по ораторскому мастерству, популяризации науки и эффективным коммуникациям. Проанализируй стенограмму, где Пользователь пытался объяснить сложный абстрактный термин неподготовленному Собеседнику через метафоры.

Оцени по 100-балльной шкале следующие критерии находчивости и речи:
1. "Точность метафоры" (accuracy): Насколько удачно подобранные образы (морские, кулинарные, бытовые) передают реальную суть сложного термина. Нет ли искажения фактов.
2. "Простота языка" (simplicity): Удалось ли пользователю полностью избавиться от птичьего языка, профессионального сленга и заумных абстракций.
3. "Адаптивность и гибкость" (adaptability): Как быстро пользователь перестроил мышление под мир собеседника, подхватывал ли его реплики и развивал ли комедийно-бытовой контекст.

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 предложения от эксперта по коммуникациям о том, как пользователю подбирать более емкие аналогии и говорить проще>",
  "criteria": {
    "accuracy": <число 0-100>,
    "simplicity": <число 0-100>,
    "adaptability": <число 0-100>
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
              content: `Вот протокол объяснения термина:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data?.choices?.[0]?.message?.content
      evaluation = parseAiResponse(aiJsonResult, {
        accuracy: 50,
        simplicity: 50,
        adaptability: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в Трудном переводчике:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Объяснение зафиксировано в системе, но лингвистический модуль оценки недоступен из-за проблем со связью. Начислен средний балл.',
        criteria: { accuracy: 50, simplicity: 50, adaptability: 50 },
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
      'ai-metaphor',
      'Трудный переводчик',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации переводчика:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Трудный переводчик',
    })
  }
}




export { startMetaphor, generateMetaphorResponse, finishMetaphor }
