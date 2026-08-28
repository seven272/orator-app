import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

// 1. Старт упражнения «Рэп-манифест»
const startPoemRap = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Объект сценария (id, topic, rhythmAnchors, textToRead)

    // Формируем приветственное сообщение от ИИ-продюсера
    const preview = `Йоу! Добро пожаловать на тренажер «Рэп-манифест». Твоя задача — превратить классическую поэзию в качающий хип-хоп трек. Тема раунда: «${exerciseData.topic}». Ориентиры для твоего флоу: [${exerciseData.rhythmAnchors.join(', ')}]. \n\nТекст для читки:\n«${exerciseData.textToRead}»\n\nЛови воображаемый бит, читай уверенно и делай мощные ритмические акценты. Запись пошла!`

    // Создаем активную сессию в БД
    await AiExercise.create({
      userId,
      exerciseType: 'poem-rap',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startPoemRap:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Рэп-манифест',
      error: error.message,
    })
  }
}

// 2. Обработка аудиозаписи от SaluteSpeech
const responsePoemRap = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания SalutSpeech в рэп-манифесте:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать аудиозапись. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-rap',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Защита от тишины в микрофоне
    if (
      !userMessage ||
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
          'Микрофон зафиксировал тишину. Раскачать бит в молчании не получится...',
        isFinished: true,
        isError: true,
      })
    }

    session.messages.push({
      role: 'user',
      text: userMessage.trim(),
    })
    await session.save()

    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Читка записана. Мой ИИ-процессор сводит дорожки и начинает музыкальный анализ!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responsePoemRap:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при обработке аудио в упражнении Рэп-манифест',
      error: error.message,
    })
  }
}

// 3. Финал и оценка ИИ-продюсера
const finishPoemRap = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-rap',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    const userMessages = session.messages.filter(
      (m) => m.role === 'user',
    )

    if (
      userMessages.length === 0 ||
      userMessages[userMessages.length - 1].text ===
        'Пользователь промолчал'
    ) {
      session.status = 'completed'
      session.score = 0
      session.result = {
        totalScore: 0,
        feedback:
          'Рэп-манифест не был зачитан, выдать музыкальный вердикт невозможно.',
        criteria: {
          rhythm: 0,
          articulation: 0,
          drive: 0,
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

    const userSpeechText = userMessages[userMessages.length - 1].text

    // Системный промпт для хип-хоп жюри
    const PROMPT = `
      Ты — опытный хип-хоп продюсер, битмейкер и эксперт по рэп-рецитативу.
      Пользователь должен был зачитать под внутренний качающий ритм (рэп-флоу) следующее стихотворение:
      "${session.exerciseData.textToRead}"

      Стиль и ориентиры читки для этого раунда: [${session.exerciseData.rhythmAnchors.join(', ')}].

      Оцени по 100-балльной шкале следующие критерии, анализируя текстовую расшифровку от STT (которую тебе пришлют):
        1. "Ритмика" (rhythm): Анализируй синтаксическую структуру расшифровки. 100 баллов, если текст разбит знаками препинания (запятые, тире, точки) симметрично, что указывает на удержание четкого такта и ритмических пауз. Снижай баллы, если текст выглядит хаотичным, скомканным или в нем полностью отсутствуют паузы там, где они логически необходимы для кача.
        2. "Четкость слогов" (articulation): Сравни оригинал и расшифровку. Рэп требует идеальной дикции на высокой скорости. Снижай баллы, если STT не распознал или исказил сложные слова, съел окончания строк или превратил стихотворный метр в неразборчивый лексический шум.
        3. "Драйв" (drive): Оценивается по лексическим маркерам и эмоциональным пикам в тексте. Высший балл ставится, если пользователь добавил характерные для рэпа междометия, восклицания, акценты (зафиксированные знаками "!" от STT), или если структура текста выдает уверенный, агрессивный или артистичный напор. Если расшифровка абсолютно сухая и безэмоциональная — снижай балл.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <средний балл от 0 до 100>,
        "feedback": "<профессиональный разбор от лица рэп-продюсера: оцени попадание в ритм, флоу и общую уверенность подачи. Используй уместный сленг вроде «флоу», «кач», «панчи», но держи рамки экспертности. 3-4 предложения>",
        "criteria": {
          "rhythm": <0-100>,
          "articulation": <0-100>,
          "drive": <0-100>
        }
      }

      Важные правила:
      - Не используй переносы строк внутри полей "feedback".
      - Не ставь лишних запятых.
      - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON-ответа. Если нужно выделить слово или термин, используй кавычки-елочки «».`

    let evaluation

    try {
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


      const aiJsonResult = response.data.choices[0]?.message?.content
      console.log('🗣️ Сырой ответ от GigaChat (Рэп):', aiJsonResult)

      evaluation = parseAiResponse(aiJsonResult, {
        rhythm: 50,
        articulation: 50,
        drive: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в рэп-тренажере:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Ваш трек сохранен, но ИИ-продюсер не смог сформировать разбор из-за сбоя обработки. Попробуйте позже.',
        criteria: {
          rhythm: 50,
          articulation: 50,
          drive: 50,
        },
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

    // Начисляем прогресс в геймификацию (используем уникальный изолированный алиас 'ai-poem-rap')
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-poem-rap',
      'Рэп-манифест',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка анализа речи в рэп-тренажере' })
  }
}

export { startPoemRap, responsePoemRap, finishPoemRap }
