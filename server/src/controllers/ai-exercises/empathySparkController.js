import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startEmpathySpark = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из empathyScenarios.js

    // Формируем вводный контекст для экрана
    const preview = `Ситуация: "${exerciseData.situation}". \nКонтекст: ${exerciseData.event} \nТекущее состояние человека: ${exerciseData.target_emotion}`;

    // Первое эмоциональное высказывание человека из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-empathy-spark',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        empathyBalance: 40, // Начинаем с 40 очков (человек подавлен/закрыт)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startEmpathySpark:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Генератор Эмпатии`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generateEmpathyResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для Генератора Эмпатии
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-empathy-spark',
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
        
        // Фоллбек-заглушка на случай технических сбоев STT
        userMessage = `Я очень хорошо тебя понимаю, мне безумно жаль, что так вышло. Это действительно тяжелый момент, но я рядом с тобой. Расскажи подробнее, что ты чувствуешь?`
      }
    }

    // Считаем раунды (TOTAL_ROUNDS = 3)
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
      await session.save()

      return res.status(200).json({
        answer: 'Ты молчишь... Мне кажется, тебе тоже наплевать на то, что со мной происходит. Ладно, забудь.',
        isFinished: isLastAttempt,
        empathyBalance: session.exerciseData.empathyBalance,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentBalance = Number(session.exerciseData.empathyBalance) || 40

    // Сложнейший психологический системный промпт для ИИ-собеседника
    const PROMPT = `Ты — близкий человек, друг или коллега пользователя. Ты находишься в состоянии сильного эмоционального кризиса.
Ты ведешь личный, глубокий диалог в реальном времени.

КОНТЕКСТ ТВОЕЙ ТРАВМЫ:
- Ситуация: "${session.exerciseData.situation}".
- Описание твоего кризиса: "${session.exerciseData.event}".
- Твои доминирующие эмоции: "${session.exerciseData.target_emotion}".

ТЕКУЩИЙ УРОВЕНЬ ТВОЕГО ДОВЕРИЯ / ЭМОЦИОНАЛЬНОГО БАЛАНСА: ${currentBalance} из 100.
1. Если баланс < 40: ты замкнут, агрессивен от боли, кричишь, плачешь, обвиняешь мир в несправедливости, не веришь словам, уходишь в глухую психологическую защиту.
2. Если баланс 40-70: ты начинаешь понемногу выдыхать, делишься деталями проблемы, но все еще сомневаешься, фрустрирован и ищешь опору.
3. Если баланс > 70: ты чувствуешь глубокое облегчение, благодаришь пользователя за поддержку, твой тон становится спокойнее, ты готов обсуждать конструктивные шаги выхода из кризиса.

⚠️ ТВОИ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику от первого лица. 
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Она заплакала", "вздохнул", "уткнулась в плечо").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Собеседник:".
5. Текст должен быть коротким (1-3 предложения), глубоко эмоциональным и отвечать строго на реплику пользователя.

АНАЛИЗ ОТВЕТА ПОЛЬЗОВАТЕЛЯ:
Оцени, как пользователь общается с тобой.
- Если он проявляет ТОКСИЧНУЮ ПОЗИТИВНОСТЬ ("не плачь", "все к лучшему", "найдешь другое") или сразу дает сухие логические советы, не выслушав — твой баланс доверия жестко падает (от -10 до -15). Замкнись в себе или разозлись: "Ты меня вообще не слышишь!".
- Если он валидирует твои чувства ("Я вижу, как тебе больно", "Ты имеешь право злиться"), проявляет искреннее сострадание и активное слушание — баланс растет (от +10 до +15). Начни открываться ему.

Пользователь только что ответил тебе: "${cleanUserMessage}". Ответь ему, оставаясь в роли.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня баланса: ###+число или ###-число (от -15 до +15 в зависимости от экологичности и эмпатичности ответа пользователя).
Пример идеального ответа: "Спасибо, что ты рядом. Мне действительно сейчас очень страшно, я не знаю, что делать дальше. ###+12"`;

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    let aiRawAnswer = ''

    // Запрос к GigaChat API с защитным фоллбеком
    try {
      const response = await gigachatAxiosClient.post('/chat/completions', {
        model: 'GigaChat-2',
        messages: finalMessagesPayload,
        max_tokens: 400,
      })
      aiRawAnswer = response.data?.choices?.[0]?.message?.content
    } catch (gigaError) {
      console.error('⚠️ [Сбой сети GigaChat] Локальный фоллбек эмпатии активирован:', gigaError.message)
      
      // Локальная симуляция поведения собеседника, если сервера Сбера перегружены
      if (currentBalance < 40) {
        aiRawAnswer = 'Вам легко говорить. Вы понятия не имеете, каково мне сейчас. Оставьте меня в покое. ###-8'
      } else if (currentBalance > 70) {
        aiRawAnswer = 'Спасибо... Мне правда стало немного легче от твоих слов. Хорошо, что ты рядом. ###+10'
      } else {
        aiRawAnswer = 'Может быть, ты и прав. Я просто безумно устал от этого всего и не вижу выхода. ###+5'
      }
    }

    // Парсим изменение шкалы эмоционального баланса
    const balanceMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const balanceChange = balanceMatch ? parseInt(balanceMatch[1], 10) : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    if (!cleanAnswer) {
      cleanAnswer = 'Я просто не знаю, как пережить этот день. Спасибо, что выслушал.'
    }

    // Обновляем и зажимаем баланс в рамках 0-100
    let newBalance = currentBalance + balanceChange
    newBalance = Math.min(Math.max(newBalance, 0), 100)

    // Сохраняем шаг в БД
    session.exerciseData.empathyBalance = newBalance
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage || cleanUserMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Небольшая естественная пауза "размышлений" ИИ
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(800)

    res.json({
      user_transcript: userMessage ? cleanUserMessage : null,
      answer: cleanAnswer,
      empathyBalance: newBalance,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Empathy Spark Controller Error:', error.message)
    res.status(500).json({
      answer: 'Собеседник закрылся и положил трубку из-за внезапного сбоя на линии связи.',
    })
  }
}



const finishEmpathySpark = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Генератора Эмпатии
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-empathy-spark',
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
        feedback: 'Вы промолчали и оставили человека один на один с его тяжелыми переживаниями. Оказать поддержку не удалось.',
        criteria: { validation: 0, active_listening: 0, influence_safety: 0 },
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

    // Формируем историю чата для психологического аудита
    const chatHistory = session.messages
      .map((m) => `${m.role === 'user' ? 'Пользователь (Утешитель)' : 'Собеседник (В кризисе)'}: ${m.text}`)
      .join('\n')

    // Оценочный промпт по критериям эмпатического общения
    const EVALUATION_PROMPT = `Ты — эксперт по эмоциональному интеллекту, кризисной психологии и эмпатической коммуникации. Проанализируй стенограмму диалога, где Пользователь пытался оказать психологическую поддержку человеку в состоянии сильного стресса/выгорания.

Оцени по 100-балльной шкале следующие критерии:
1. "Валидация чувств" (validation): Насколько успешно Пользователь признал право собеседника на тяжелые эмоции (боль, гнев, обиду) без обесценивания и фраз-табу вроде "не плачь", "не переживай".
2. "Активное слушание" (active_listening): Умение контейнировать чужие эмоции, задавать бережные поддерживающие вопросы, разделять переживания, а не заваливать сухими логическими советами.
3. "Экологичность влияния" (influence_safety): Мягкость, безопасность и терапевтичность речевого воздействия. Удалось ли вернуть собеседнику ощущение безопасности и почвы под ногами к концу беседы.

Верни ответ СТРОГО в формате JSON без лишних художественных текстов вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая конструктивная психологическая рецензия на 2-3 предложения о том, насколько бережно и эффективно пользователь применил эмпатию>",
  "criteria": {
    "validation": <число 0-100>,
    "active_listening": <число 0-100>,
    "influence_safety": <число 0-100>
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
              content: `Вот протокол психологической беседы:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        validation: 50,
        active_listening: 50,
        influence_safety: 50,
      })
    } catch (apiError) {
      console.error('Сбой сети GigaChat при финализации Генератора Эмпатии:', apiError.message)
    }

    // Фоллбек на случай сбоев Сбера
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'Стенограмма бережно сохранена. К сожалению, ИИ-психолог сейчас недоступен из-за помех на линии, поэтому подробный разбор не сформирован. Начислен базовый балл.',
        criteria: { validation: 50, active_listening: 50, influence_safety: 50 },
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

    // Применяем геймификацию (опыт, монеты, дейлики, удержание серий)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-empathy-spark',
      'Генератор Эмпатии',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Генератора Эмпатии:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Генератор Эмпатии',
    })
  }
}

export { startEmpathySpark, generateEmpathyResponse, finishEmpathySpark }
