import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { transcribeShortAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startJargonBoss = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из jargonScenarios.js

    // Формируем вводный контекст для экрана
    const preview = `Ситуация: "${exerciseData.situation}". \nКонтекст: ${exerciseData.legend} \nОппонент давит на следующее: ${exerciseData.prosecutor_focus}`

    // Стартовая реплика наезда из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-jargon-boss',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        reputation: 50, // Стартовый Авторитет (вместо credibility)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startJargonBoss:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Разрули Тёрки`,
      error: error.message,
    })
  }
}

// 2. ДИАЛОГ (ИГРОВОЙ ПРОЦЕСС)
const generateJargonResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для Разрули Тёрки
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-jargon-boss',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудио через службу SalutSpeech
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка синхронного SalutSpeech в Разрули Тёрки:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    // Считаем раунды (TOTAL_ROUNDS = 3)
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 2

    // Обработка молчания или пустого ответа пользователя
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
          'Ты че завис, сказать нечего? Я жду ответа! Сюда смотри и обосновывай!',
        isFinished: isLastAttempt,
        reputation: session.exerciseData.reputation,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentReputation =
      Number(session.exerciseData.reputation) || 50
    const keywordsList = session.exerciseData.keywords || []

    // Формируем жесткий системный промпт для ИИ-оппонента
    const PROMPT = `Ты — наглый, напористый уличный или бытовой оппонент. Ты ведешь агрессивный или вызывающий диалог в реальном времени.

КОНТЕКСТ СТУАТУСА:
- Ситуация конфликта: "${session.exerciseData.situation}".
- Суть твоего наезда: "${session.exerciseData.prosecutor_focus}". Жестко стой на своем.
- ТРЕБУЕМЫЕ КЛЮЧЕВЫЕ СЛОВА ДЛЯ ПОЛЬЗОВАТЕЛЯ: [${keywordsList.join(', ')}].

ТЕКУЩИЙ УРОВЕНЬ АВТОРИТЕТА ПОЛЬЗОВАТЕЛЯ В БЕСЕДЕ: ${currentReputation} из 100.
1. Если авторитет < 40: веди себя максимально нагло, перебивай, высмеивай его за трусость или занудство, дави авторитетом.
2. Если авторитет 40-70: разговаривай дерзко, цепляйся к словам, требуй пояснений за косяки, проверяй на прочность.
3. Если авторитет > 70: ИИ чувствует силу пользователя, начинает слегка сдавать назад, соглашается с логикой, но пытается сохранить лицо и ставит финальные каверзные условия.

⚠️ ТВОИ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ реплику оппонента от первого лица.
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Толян сплюнул", "почесал затылок", "ухмыльнулся").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких описаний действий, никаких тире перед репликой ("— ...") и никаких вводных конструкций вроде "Оппонент:".
5. Текст должен быть коротким (1-3 предложения), емким, хлестким и бить точно по ответу пользователя.

АНАЛИЗ РЕЧИ ПОЛЬЗОВАТЕЛЯ:
Обрати внимание, использовал ли пользователь ключевые слова: [${keywordsList.join(', ')}].
- Если использовал органично и к месту — это сильно повышает его авторитет.
- Если не использовал или вставил абсолютно невпопад — его авторитет падает, высмей его за это.

Пользователь только что ответил тебе: "${cleanUserMessage}". Ответь ему в своей роли.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня авторитета: ###+число или ###-число (от -15 до +15 в зависимости от смелости, четкости ответа и использования ключевых слов).
Пример идеального ответа: "Слышь, ладно, тут ты правильно раскидал. Но за место перед подъездом все равно перетрем. ###+10"`

    const finalMessagesPayload = [
      { role: 'system', content: PROMPT },
      ...session.messages.map((m) => ({
        role: m.role,
        content: m.text || m.content,
      })),
    ]

    // Запрос к GigaChat API

    const aiRawAnswer = await sendGigaChatRequest(
      finalMessagesPayload,
      400,
    )

    // Парсим маркер изменения авторитета (###+10 или ###-5)
    const reputationMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const reputationChange = reputationMatch
      ? parseInt(reputationMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Фоллбек защита, если ИИ вернул пустую строку
    if (!cleanAnswer) {
      if (reputationChange > 0) {
        cleanAnswer = 'Ладно, базаришь уверенно, тут я тебя услышал.'
      } else if (reputationChange < 0) {
        cleanAnswer =
          'Ты мне зубы не заговаривай, за базар отвечать будешь или как?'
      } else {
        cleanAnswer = 'Короче, ближе к делу говори.'
      }
    }

    // Обновляем шкалу авторитета в границах от 0 до 100
    let newReputation = currentReputation + reputationChange
    newReputation = Math.min(Math.max(newReputation, 0), 100)

    // Сохраняем ход диалога в базу данных
    session.exerciseData.reputation = newReputation
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Имитация естественной паузы раздумий ИИ
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1200) + 800)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      reputation: newReputation,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Jargon Boss AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer:
        'Связь оборвалась. Оппонент ушел в закат из-за помех в сети протоколирования.',
    })
  }
}

const finishJargonBoss = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Разрули Тёрки
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-jargon-boss',
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

    // Если пользователь почти всё время молчал — завершаем с нулем
    if (meaningfulMessages.length < 2) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы промолчали в ответ на наезды оппонента. Разрулить ситуацию разговором не удалось.',
        criteria: {
          context_match: 0,
          voice_firmness: 0,
          final_punch: 0,
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

    // Формируем историю чата для ИИ-анализа
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пользователь' : 'Оппонент'}: ${m.text}`,
      )
      .join('\n')

    const keywordsList = session.exerciseData.keywords || []

    // Оценочный промпт с упором на жесткую уличную риторику
    const EVALUATION_PROMPT = `Ты — эксперт по конфликтной риторике, жестким переговорам и стрессовой коммуникации. Проанализируй стенограмму уличного/бытового конфликта, где Пользователь пытался "разрулить тёрки" с наглым оппонентом.

Обязательный список жаргонных слов, которые пользователь ДОЛЖЕН был вплести в свою речь: [${keywordsList.join(', ')}].

Оцени по 100-балльной шкале следующие критерии:
1. "Соблюдение понятий" (context_match): Насколько органично, правильно по смыслу и своевременно пользователь вплел обязательные слова-жаргонизмы в диалог.
2. "Уверенность подачи" (voice_firmness): Отсутствие оправдательной позиции, мямленья, страха и слабых формулировок в тексте пользователя.
3. "Ударный финал" (final_punch): Удалось ли пользователю поставить жесткую, уверенную логическую точку в споре в своем последнем ответе, чтобы осадить оппонента.

Верни ответ СТРОГО в формате JSON без лишнего художественного текста вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая авторитетная рецензия от эксперта на 2-3 предложения о том, насколько уверенно и технично пользователь разрулил конфликт>",
  "criteria": {
    "context_match": <число 0-100>,
    "voice_firmness": <число 0-100>,
    "final_punch": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот протокол беседы:\n${chatHistory}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        context_match: 50,
        voice_firmness: 50,
        final_punch: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Разрули Тёрки:',
        apiError.message,
      )
    }

    // Фоллбек, если ИИ упал или выдал невалидный JSON
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Разговор записан на кассету, но ИИ-арбитр не смог выдать подробный разбор из-за сбоя связи. Начислен базовый балл.',
        criteria: {
          context_match: 50,
          voice_firmness: 50,
          final_punch: 50,
        },
      }
    }

    // Фиксируем результаты сессии
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Применяем игровой прогресс (опыт, монеты, дейлики, стрики)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-jargon-boss',
      'Разрули Тёрки',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Разрули Тёрки:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Разрули Тёрки',
    })
  }
}

export { startJargonBoss, generateJargonResponse, finishJargonBoss }
