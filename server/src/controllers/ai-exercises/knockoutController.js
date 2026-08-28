import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startKnockout = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    // Формируем вводный контекст для экрана Stand-Up сцены
    const preview = `Вы на сцене шоу «Открытый микрофон». Ситуация: "${exerciseData.situation}". Контекст выступления: "${exerciseData.context}". Фокус подколов ИИ-комика: ${exerciseData.heckler_focus}`

    // Первая реплика (токсичный выкрик или подкол ведущего) берется напрямую из сценария
    const question = exerciseData.init_phrase

    await AiExercise.create({
      userId,
      exerciseType: 'knockout',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        audienceReputation: 50, // Стартовая репутация в зале (медиана)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startKnockout:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте упражнения Остроумный нокаут`,
      error: error.message,
    })
  }
}

const generateKnockoutResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию для knockout
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'knockout',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Расшифровка аудио шутки через SalutSpeech
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка синхронного SalutSpeech в стендапе:', speechError)
        return res.status(500).json({
          message: 'Не удалось расслышать вашу шутку. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    const attemptsCount = session.messages.filter((m) => m.role === 'user').length
    const isLastAttempt = attemptsCount >= 2 // Ограничение в 3 раунда

    // Обработка молчания пользователя на сцене
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
        answer: 'Ну и чего ты замолчал? Микрофон проглотил? Зал ждет, выдай хоть что-то, кроме неловкой паузы!',
        isFinished: isLastAttempt,
        audienceReputation: session.exerciseData.audienceReputation,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentReputation = Number(session.exerciseData.audienceReputation) || 50

    const PROMPT = `Ты — токсичный, острый на язык стендап-комик (или выкрикивающий хеклер из зала). Ты ведешь комедийную дуэль с пользователем на сцене в реальном времени.

КОНТЕКСТ ВЫСТУПЛЕНИЯ:
- Ситуация на сцене: "${session.exerciseData.situation}".
- Описание контекста: "${session.exerciseData.context}".
- ТВОЙ ГЛАВНЫЙ ФОКУС ДЛЯ НАПАДЕНИЯ: "${session.exerciseData.heckler_focus}". Бей точно по этим триггерам, внешнему виду или поведению.

ТЕКУЩИЙ УРОВЕНЬ ОДОБРЕНИЯ ЗАЛА: ${currentReputation} из 100.
1. Если одобрение < 40: зал на твоей стороне. Уничтожай пользователя еще жестче, высмеивай его неловкость, празднуй победу.
2. Если одобрение 40-70: веди плотный комедийный баттл, цепляйся за его слова, ищи новые слабые места в его ответах.
3. Если одобрение > 70: зал начинает поддерживать пользователя. Слегка растеряйся, огрызайся более нервно, пытайся вернуть контроль над публикой.

ПОВЕДЕНИЕ:
Оценивай ответ пользователя по критериям: скорость реакции, юмор, самоирония. Если он пошутил смешно или круто обыграл твой выпад (особенно с самоиронией) — зал взрывается аплодисментами (репутация пользователя растет). Если ответ скучный, оправдывающийся или агрессивный без юмора — зал гудит (репутация падает).

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОДНУ короткую комедийную реплику от первого лица. 
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Зал рассмеялся", "комик ухмыльнулся").
3. ЗАПРЕЩЕНО дописывать реплики за пользователя или придумывать продолжение диалога.
4. Никаких художественных описаний действий, никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Комик:".
5. Текст должен быть коротким (1-2 емких предложения) и звучать как живой, хлесткий подкол.

Пользователь только что ответил: "${cleanUserMessage}". Сделай ему ответный комедийный выпад.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения репутации пользователя в глазах зала: ###+число или ###-число (от -15 до +15 в зависимости от остроумия и самоиронии пользователя).
Пример идеального ответа: "Ого, ну ладно, шутка про твою прическу была неплохой. Но спорим, твой парикмахер до сих пор плачет, когда видит это? ###+8"`

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

    // Парсим изменение репутации (###+10)
    const repMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const repChange = repMatch ? parseInt(repMatch[1], 10) : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Защитный фоллбек, если ИИ вернул пустой текст
    if (!cleanAnswer) {
      if (repChange > 0) {
        cleanAnswer = 'Ладно-ладно, это было неплохо. Зал оценил.'
      } else if (repChange < 0) {
        cleanAnswer = 'И это всё, что ты смог выдать под микрофон? Слабо!'
      } else {
        cleanAnswer = 'Ну допустим. Посмотрим, как ты справишься со следующим.'
      }
    }

    // Обновляем шкалу репутации в пределах 0-100
    let newReputation = currentReputation + repChange
    newReputation = Math.min(Math.max(newReputation, 0), 100)

    // Сохраняем шаг в БД
    session.exerciseData.audienceReputation = newReputation
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Имитация раздумий ИИ-комика перед микрофоном
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1200) + 800)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      audienceReputation: newReputation,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Knockout AI Error:', error.response?.data || error.message)
    res.status(503).json({
      answer: 'В клубе временно отключилось электричество и микрофоны погасли. (Ошибка связи)',
    })
  }
}

const finishKnockout = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'knockout',
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
        feedback: 'Вы промолчали большинство раундов, залу не удалось услышать ваши панчи.',
        criteria: { reaction: 0, humor: 0, irony: 0 },
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
          `${m.role === 'user' ? 'Комик (Пользователь)' : 'Хеклер/Ведущий (ИИ)'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям комедийного импровизационного баттла
    const EVALUATION_PROMPT = `Ты — опытный продюсер комедийных шоу и главный судья Stand-Up баттлов. Проанализируй стенограмму выступления, где Пользователь отбивался от колких подколов оппонента на сцене.

Оцени по 100-балльной шкале следующие критерии:
1. "Скорость реакции и находчивость" (reaction): Насколько быстро и точно пользователь подхватывал тему выпада, не зависал ли в оправданиях.
2. "Юмор и плотность панчей" (humor): Было ли это смешно, оригинально, присутствуют ли неожиданные комедийные повороты.
3. "Самоирония" (irony): Умение пользователя посмеяться над собой, перевернуть колкость оппонента в шутку над своими недостатками, полностью обезоружив хеклера.

Верни ответ СТРОГО в формате JSON без лишнего текста:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткий конструктивный совет на 2-3 sentences от лица комедийного продюсера о том, как пользователю улучшить свои панчи и комедийный отпор>",
  "criteria": {
    "reaction": <число 0-100>,
    "humor": <число 0-100>,
    "irony": <число 0-100>
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
              content: `Вот протокол стендап-дуэли:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      const aiJsonResult = response.data.choices[0].message.content
      evaluation = parseAiResponse(aiJsonResult, {
        reaction: 50,
        humor: 50,
        irony: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в Остроумном нокауте:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Выступление завершено, но продюсер шоу отвлекся и не смог написать подробное резюме из-за сбоя связи. Начислен базовый балл.',
        criteria: { reaction: 50, humor: 50, irony: 50 },
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
      'ai-knockout',
      'Остроумный нокаут',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации нокаута:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Остроумный нокаут',
    })
  }
}


export { startKnockout, generateKnockoutResponse, finishKnockout }
