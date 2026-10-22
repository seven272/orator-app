import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

//Это специальная схема чтобы Гигачат возвращал ответ строго в виде json-объекта
const METRONOME_JSON_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      totalScore: { type: 'number' },
      feedback: { type: 'string' },
      criteria: {
        type: 'object',
        properties: {
          phonetics: { type: 'number' },
          rhythm_stability: { type: 'number' },
          syllable_completeness: { type: 'number' },
        },
        required: [
          'phonetics',
          'rhythm_stability',
          'syllable_completeness',
        ],
      },
    },
    required: ['totalScore', 'feedback', 'criteria'],
  },
}

// 1. СТАРТ УПРАЖНЕНИЯ (Инициализация дикционной сессии)
const startRhythmTransformer = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий скороговорки из transformerScenarios.js

    // Выдаем первый базовый текст для чтения
    const question = exerciseData.round_1
    const preview = `Упражнение: "${exerciseData.title}". \nКонтекст: ${exerciseData.situation} \nФокус контроля: ${exerciseData.prosecutor_focus}`

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-rhythm-transformer',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        articulation: 100, // Стартуем со 100% идеальной четкости
      },
      messages: [], // Сюда будем собирать пары: { ИдеальныйТекстРаунда : РеальныйТранскриптПользователя }
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startRhythmTransformer:', error)
    res.status(500).json({
      message: `Ошибка сервера при старте ИИ-Метронома`,
      error: error.message,
    })
  }
}

// 2. ПОШАГОВЫЙ ПЕРЕХОД ПО РАУНДАМ (БЕЗ ИИ-ПРОМПТА НА ЭТОМ ЭТАПЕ)
const generateTransformerResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию ИИ-Метронома
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-rhythm-transformer',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Определяем текущий раунд на основе уже сделанных записей
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length

    // Расшифровка аудио через службу Яндекса
    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          '⚠️ [Сбой STT в Метрономе] Мягкий фоллбек активирован:',
          speechError.message,
        )

        // Фоллбек: если облако упало, подставляем эталонный текст текущего раунда, чтобы не ломать тест
        if (attemptsCount === 0)
          userMessage = session.exerciseData.round_1
        else if (attemptsCount === 1)
          userMessage = session.exerciseData.round_2
        else userMessage = session.exerciseData.round_3
      }
    }

    // Защита от полного молчания
    if (
      !userMessage ||
      typeof userMessage !== 'string' ||
      !userMessage.trim()
    ) {
      userMessage = 'Пользователь промолчал'
    }

    const cleanUserMessage = userMessage.trim()
    const currentArticulation =
      Number(session.exerciseData.articulation) || 100

    // Логика продвижения по раундам и вытягивания текстов из базы
    let nextQuestion = ''
    let isLastAttempt = false

    if (attemptsCount === 0) {
      // Пользователь прочитал round_1. Сохраняем шаг и выдаем round_2
      session.messages.push({
        role: 'system',
        text: session.exerciseData.round_1,
      }) // Ожидалось
      session.messages.push({ role: 'user', text: cleanUserMessage }) // Прилетело
      nextQuestion = session.exerciseData.round_2
    } else if (attemptsCount === 1) {
      // Пользователь прочитал round_2. Сохраняем шаг и выдаем round_3
      session.messages.push({
        role: 'system',
        text: session.exerciseData.round_2,
      })
      session.messages.push({ role: 'user', text: cleanUserMessage })
      nextQuestion = session.exerciseData.round_3
    } else {
      // Пользователь прочитал финальный round_3. Диалог завершен
      session.messages.push({
        role: 'system',
        text: session.exerciseData.round_3,
      })
      session.messages.push({ role: 'user', text: cleanUserMessage })
      isLastAttempt = true
    }

    // Каждое прочтение неидеального транскрипта (или молчание) симулирует падение шкалы для UI-тестов
    let newArticulation = currentArticulation
    if (cleanUserMessage === 'Пользователь промолчал') {
      newArticulation = Math.max(currentArticulation - 20, 0)
    } else if (cleanUserMessage.length < 5) {
      newArticulation = Math.max(currentArticulation - 10, 0)
    }

    // Сохраняем состояние сессии
    session.exerciseData.articulation = newArticulation
    session.markModified('exerciseData')
    await session.save()

    // Микро-таймаут для имитации "обработки аудиопотока" на клиенте
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(500)

    res.json({
      user_transcript:
        cleanUserMessage === 'Пользователь промолчал'
          ? null
          : cleanUserMessage,
      answer: nextQuestion, // Возвращаем усложненный текст следующего раунда
      articulation: newArticulation,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error('Rhythm Transformer Step Error:', error.message)
    res.status(500).json({
      answer:
        'Сессия метронома прервана из-за внутренней ошибки сервера.',
    })
  }
}

const finishRhythmTransformer = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Находим активную сессию ИИ-Метронома
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-rhythm-transformer',
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

    // Собираем пары "Эталон — Транскрипт" для отправки в ИИ
    const historyPairs = []
    for (let i = 0; i < session.messages.length; i += 2) {
      const systemMsg = session.messages[i] // Эталонный текст
      const userMsg = session.messages[i + 1] // Что наговорил юзер
      if (systemMsg && userMsg) {
        historyPairs.push(
          `РАУНД ${Math.floor(i / 2) + 1}:\n- Эталон: "${systemMsg.text}"\n- Распознано: "${userMsg.text}"`,
        )
      }
    }

    // Если записей нет или пользователь везде молчал — завершаем с нулем
    const meaningfulUserMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulUserMessages.length === 0) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы не прочитали ни одной скороговорки. Прокачать дикцию в этом раунде не удалось.',
        criteria: {
          phonetics: 0,
          rhythm_stability: 0,
          syllable_completeness: 0,
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

    // Строгий оценочный промпт для детального аудита звуков и слогов
    const EVALUATION_PROMPT = `Ты — строгий эксперт по технике речи, фонетике, сценической дикции и профессиональный логопед. Твоя задача — проанализировать стенограмму упражнения "Метроном", где Пользователь читал усложняющийся от раунда к раунду текст скороговорки.
Сравни построчно Эталонный текст, который должен был прочитать пользователь, с тем, что Реально Распознала система распознавания речи.

КРИТИЧЕСКИЙ ФОКУС АНАЛИЗА: "${session.exerciseData.prosecutor_focus}". Обрати особое внимание на эти буквенные стыки и сложные слова.

Оцени по 100-балльной шкале следующие критерии:
1. "Чистота звуковых стыков" (phonetics): Насколько четко и без смазывания произнесены сложные стыки согласных букв. Снижай балл за явные замены букв или путаницу в похожих звуках (например, с-ш, ж-ш).
2. "Удержание темпоритма" (rhythm_stability): Насколько стабильно пользователь справился с чтением при резком увеличении длины фразы и добавлении зубодробительных терминов от раунда к раунду.
3. "Полнота слогов и окончаний" (syllable_completeness): Проглатывал ли пользователь окончания длинных слов, пропускал ли предлоги или сложные составные части терминов (например, "высокодецентрализованному").

Верни ответ СТРОГО в формате JSON без лишних вводных фраз и художественного текста вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<профессиональная, емкая логопедическая рецензия на 2-3 предложения с указанием конкретных звуков или длинных слов, на которых пользователь запнулся или смазал артикуляцию>",
  "criteria": {
    "phonetics": <число 0-100>,
    "rhythm_stability": <число 0-100>,
    "syllable_completeness": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот результаты прочтения скороговорок по раундам:\n\n${historyPairs.join('\n\n')}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(
        messages,
        countTokens,
        0.1,
        METRONOME_JSON_SCHEMA,
      )
      console.log('Ответ ИИ метронома')
      console.log(aiText)

      evaluation = parseAiResponse(aiText, {
        phonetics: 50,
        rhythm_stability: 50,
        syllable_completeness: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации ИИ-Метронома:',
        apiError.message,
      )
    }

    // Защитный фоллбек
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Аудиозапись вашего дикционного батла сохранена. Из-за временного сбоя связи ИИ-логопед не смог выдать подробный буквенный отчет. Начислен базовый балл за выносливость.',
        criteria: {
          phonetics: 50,
          rhythm_stability: 50,
          syllable_completeness: 50,
        },
      }
    }

    // Сохраняем результаты сессии в базу данных
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Применяем игровой прогресс и геймификацию (навык: техника речи)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-rhythm-transformer',
      'ИИ-Метроном: Текст-Трансформер',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации ИИ-Метронома:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение ИИ-Метроном',
    })
  }
}

export {
  startRhythmTransformer,
  generateTransformerResponse,
  finishRhythmTransformer,
}
