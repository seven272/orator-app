import { sendGigaChatRequest } from '../../utils/gigachatService.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

const startNesmeyana = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает объект выбранного сценария из nesmeyanaScenarios.js

    if (!exerciseData || !exerciseData.id) {
      return res.status(400).json({
        message:
          'Необходимо передать данные сценария для старта тренажера',
      })
    }

    // Формируем ораторский контекст для экрана
    const preview = `Ваш слушатель: ${exerciseData.character}.\nОбстановка: ${exerciseData.context}\nФокус внимания ИИ: ${exerciseData.criteria_focus}.`

    // Создаем активную сессию тренажера в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-nesmeyana',
      status: 'active',
      exerciseData: {
        ...exerciseData,
      },
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startNesmeyana:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Несмеяна',
      error: error.message,
    })
  }
}

// 2. ФИКСАЦИЯ И СТЕНОГРАММА МОНОЛОГА (ИГРОВОЙ ПРОЦЕСС)
const generateNesmeyanaResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию тренажера "Несмеяна"
    const session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-nesmeyana',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res
        .status(400)
        .json({ message: 'Активная сессия не найдена.' })
    }

    // Расшифровка аудиофайла через Яндекс Спич (STT)
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error('Ошибка STT в тренажере Несмеяна:', speechError)
        return res.status(500).json({
          message:
            'Не удалось распознать вашу речь. Пожалуйста, повторите запись анекдота.',
          error: speechError.message,
        })
      }
    }

    // Обработка молчания оратора
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
        isFinished: false, // Даем оратору шанс переписать речь
      })
    }

    const cleanUserMessage = userMessage.trim()

    // Сохраняем стенограмму. Монолог окончен — первая же запись закрывает раунд
    session.messages.push({ role: 'user', text: cleanUserMessage })
    await session.save()

    res.json({
      user_transcript: cleanUserMessage,
      isFinished: true, // Сигнал фронтенду для разблокировки итогового отчета ИИ
    })
  } catch (error) {
    console.error('Free Artist Response Error:', error.message)
    res.status(500).json({
      message: 'Ошибка сервера при фиксации текста анекдота',
    })
  }
}

const finishNesmeyana = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Несмеяны
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-nesmeyana',
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

    // Фильтруем пустые реплики
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    // Если оратор промолчал
    if (meaningfulMessages.length < 1) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Вы не произнесли ни слова. Персонаж покинул комнату, так и не дождавшись шутки.',
        criteria: {
          expressiveness_tone: 0,
          timing_pause: 0,
          text_precision: 0,
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

    const speechText = meaningfulMessages.map((m) => m.text).join(' ')

    // Специализированный комедийный промпт для ИИ-судьи
    const EVALUATION_PROMPT = `Ты — профессиональный эксперт по комедийной драматургии, стендапу и актерскому мастерству. Твоя задача — объективно оценить, как оратор рассказал анекдот хмурому персонажу.

ПЕРСОНАЖ: "${session.exerciseData.character}"
ОБСТАНОВКА: "${session.exerciseData.context}"
ФОКУС ПРОВЕРКИ: "${session.exerciseData.criteria_focus}"

ЭТАЛОННЫЙ ТЕКСТ АНЕКДОТА: "${session.exerciseData.joke_body}"

Проанализируй стенограмму речи пользователя и выстави оценки по 100-балльной шкале:
1. "Выразительность и тон" (expressiveness_tone): Насколько живо звучит текст, видны ли маркеры эмоциональных акцентов, восклицаний или отыгрыша диалога персонажей.
2. "Тайминг пауз" (timing_pause): Удалось ли оратору выдержать драматургическую паузу перед финальным панчлайном (концовкой анекдота) или текст затораторен сплошным потоком.
3. "Точность текста" (text_precision): Насколько близко к эталонному тексту рассказана шутка. Нет ли серьезных искажений смысла и слов-паразитов, ломающих комедийную структуру.

Верни ответ СТРОГО в формате JSON без лишнего художественного текста, преамбул или Markdown-кода вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<ироничная, но полезная рецензия от лица ИИ-эксперта на 2-3 предложения. Опиши реакцию персонажа на юмор (рассмеялся ли он) и дай совет по актерской игре на будущее>",
  "criteria": {
    "expressiveness_tone": <число 0-100>,
    "timing_pause": <число 0-100>,
    "text_precision": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот стенограмма того, как оратор прочитал анекдот:\n${speechText}`,
        },
      ]
      const countTokens = 800

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        expressiveness_tone: 50,
        timing_pause: 50,
        text_precision: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Несмеяны:',
        apiError.message,
      )
    }

    // Защитный фоллбек
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Анекдот записан, но ИИ-арбитр не смог сформировать подробный отчет из-за сбоя связи. Начислен базовый балл за попытку.',
        criteria: {
          expressiveness_tone: 50,
          timing_pause: 50,
          text_precision: 50,
        },
      }
    }

    // Обновляем результаты сессии
    session.status = 'completed'
    session.score = evaluation.totalScore
    session.result = {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
    }

    await session.save()

    // Применяем игровой прогресс
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-nesmeyana',
      'Несмеяна',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Несмеяны:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Несмеяна',
    })
  }
}

export { startNesmeyana, generateNesmeyanaResponse, finishNesmeyana }
