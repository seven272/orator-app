import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. ИНИЦИАЛИЗАЦИЯ СЕССИИ (СТАРТ)
const startFreeArtist = async (req, res) => {
  try {
    const userId = req.userId
    const { customTopic } = req.body

    // Защита: тема обязательно должна быть передана
    if (!customTopic || !customTopic.trim()) {
      return res.status(400).json({
        message:
          'Необходимо указать тему выступления для обучения ИИ',
      })
    }

    const trimmedTopic = customTopic.trim()

    // Формируем академическое приветствие для экрана
    const preview = `Вы запустили индивидуальную песочницу оратора. Тема вашего выступления: "${trimmedTopic}". ИИ-эксперт готов к анализу. Пожалуйста, включите микрофон и произнесите ваш монолог.`

    // Создаем активную сессию в MongoDB под новый тип тренажера
    await AiExercise.create({
      userId,
      exerciseType: 'ai-free-artist',
      status: 'active',
      exerciseData: {
        topic: trimmedTopic,
      },
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startFreeArtist:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при старте упражнения Свободный художник',
      error: error.message,
    })
  }
}
// 2. ФИКСАЦИЯ И СТЕНОГРАММА МОНОЛОГА (ИГРОВОЙ ПРОЦЕСС)
const generateFreeArtistResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию нового тренажера
    const session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-free-artist',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудиофайла через SalutSpeech
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка SalutSpeech в Свободном художнике:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись монолога.',
          error: speechError.message,
        })
      }
    }

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
        user_transcript: '',
        isFinished: false, // Оставляем на том же экране для повторной попытки
      })
    }

    const cleanUserMessage = userMessage.trim()

    // Так как это монолог, первая же успешная запись завершает речевой этап
    session.messages.push({ role: 'user', text: cleanUserMessage })
    await session.save()

    res.json({
      user_transcript: cleanUserMessage,
      isFinished: true, // Сигнализирует фронтенду активировать финальную кнопку
    })
  } catch (error) {
    console.error('Free Artist Response Error:', error.message)
    res.status(500).json({
      message: 'Ошибка сервера при записи речевого потока монолога',
    })
  }
}
// 3. ГЛУБОКАЯ ИИ-ОЦЕНКА И ПОДВЕДЕНИЕ ИТОГОВ
const finishFreeArtist = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Свободного художника
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-free-artist',
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

    // Фильтруем пустые или промолчавшие реплики
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если оратор промолчал — завершаем раунд с нулевыми баллами
    if (meaningfulMessages.length < 1) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы не произнесли речь. ИИ-эксперт не смог провести аудит пустого монолога.',
        criteria: {
          logic_structure: 0,
          persuasiveness_vocabulary: 0,
          speech_clarity: 0,
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

    // Собираем текст выступления для анализа искусственным интеллектом
    const speechText = meaningfulMessages.map((m) => m.text).join(' ')

    // Оценочный промпт по критериям ораторского искусства
    const EVALUATION_PROMPT = `Ты — строгий, высококвалифицированный эксперт по риторике, ораторскому мастерству и публичным выступлениям. Твоя задача — провести глубокий лингвистический и логический аудит монолога, который наговорил пользователь.

КОНТЕКСТ И ТЕМА ВЫСТУПЛЕНИЯ: "${session.exerciseData.topic}"

Оцени речь оратора строго по 100-балльной шкале по следующим универсальным ораторским критериям:
1. "Логика и структура" (logic_structure): Проверь наличие вступления, тезисной части, аргументации и четкого логического вывода/призыва. Насколько последовательно развернута мысль в рамках заявленной темы.
2. "Убедительность и богатство языка" (persuasiveness_vocabulary): Сила аргументов, разнообразие лексики, использование метафор и речевых оборотов. Отсутствие избыточной тавтологии.
3. "Чистота речи" (speech_clarity): Оцени чистоту текста, отсутствие слов-паразитов ("ну", "как бы", "это самое", "короче"), повторов и междометий, указывающих на заминки мышления.

Верни ответ СТРОГО в формате JSON без лишнего художественного текста, преамбул или Markdown-кода вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<профессиональная экспертная рецензия на 2-3 предложения: выдели сильные стороны речи и дай одно конкретное напутствие по улучшению стиля подачи>",
  "criteria": {
    "logic_structure": <число 0-100>,
    "persuasiveness_vocabulary": <число 0-100>,
    "speech_clarity": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот стенограмма выступления пользователя:\n${speechText}`,
        },
      ]
      const countTokens = 800

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        logic_structure: 50,
        persuasiveness_vocabulary: 50,
        speech_clarity: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Свободного художника:',
        apiError.message,
      )
    }

    // Защитный фоллбек на случай обрыва соединения с нейросетью
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Речь зафиксирована, но из-за сетевого сбоя подробный аналитический отчет не сформирован. Начислен гарантированный базовый балл.',
        criteria: {
          logic_structure: 50,
          persuasiveness_vocabulary: 50,
          speech_clarity: 50,
        },
      }
    }

    // Обновляем статус и результаты сессии
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Применяем игровой прогресс (опыт, монеты, дейлики)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-free-artist',
      'Свободный художник',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Свободного художника:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Свободный художник',
    })
  }
}

export {
  startFreeArtist,
  generateFreeArtistResponse,
  finishFreeArtist,
}
