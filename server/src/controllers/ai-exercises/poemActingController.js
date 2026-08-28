import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

// 1. Старт упражнения
const startPoemActing = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    const preview = `Тема: «${exerciseData.topic}». \nВаша роль: ${exerciseData.actingRole}.\nИнструкция: ${exerciseData.instructions}\n\nТекст для чтения:\n«${exerciseData.poemText}»\n\nПеревоплощайтесь в персонажа, включайте запись и покажите максимум актерской игры!`

    await AiExercise.create({
      userId,
      exerciseType: 'poem-acting',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startPoemActing:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Мастер дубляжа',
      error: error.message,
    })
  }
}

// 2. Обработка аудиозаписи
const responsePoemActing = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания в мастере дубляжа:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать актерскую запись. Попробуйте еще раз.',
          error: speechError.message,
        })
      }
    }

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-acting',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

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
          'Вы ничего не наговорили, оценить актерскую подачу невозможно...',
        isFinished: true,
        isError: true,
      })
    }

    session.messages.push({ role: 'user', text: userMessage.trim() })
    await session.save()

    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Режиссерский дубль записан. ИИ-жюри ушло отсматривать материал!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responsePoemActing:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при обработке аудио в упражнении Мастер дубляжа',
      error: error.message,
    })
  }
}

// 3. Анализ актерской игры ИИ-режиссером
const finishPoemActing = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'poem-acting',
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
          'Актерский дубль не был записан, оценка невозможна.',
        criteria: { characterMatch: 0, intonation: 0, creativity: 0 },
      }
      await session.save()

      return res.status(200).json({
        message: 'Упражнение завершено без оценки',
        session,
        earnedXp: 0,
        earnedCoins: 0,
      })
    }

    const userSpeechText = userMessages[userMessages.length - 1].text

    const PROMPT = `
      Ты — опытный театральный режиссер, кастинг-директор и эксперт по актерскому мастерству.
      Пользователь должен был прочитать стихотворение: "${session.exerciseData.poemText}"
      Строго в заданной РОЛИ: «${session.exerciseData.actingRole}».
      Инструкция к роли: "${session.exerciseData.instructions}".

      Тебе на вход передается текстовая расшифровка аудиозаписи пользователя (от STT). Оцени её по 100-балльной шкале:
        1. "Попадание в образ" (characterMatch): Насколько текст отражает энергетику роли. Если роль требовала агрессии, страха или пафоса, ищи лексические маркеры, междометия (ха-ха, ого, ух), звукоподражания или характерные восклицания, которые пользователь добавил для отыгрыша.
        2. "Интонационная гибкость" (intonation): Оценивай по знакам препинания, которые расставил STT на основе пауз пользователя. Многоточия и точки посреди фраз — маркер драматических пауз, вздохов или шепота. Восклицательные знаки — эмоциональные пики. Если знаков препинания нет вообще (текст сплошным полотном) — речь была монотонной, снижай балл.
        3. "Оригинальность" (creativity): 100 баллов, если пользователь не просто прочитал сухой текст, а добавил уникальные актерские вводные реплики, междометия или импровизационные концовки, идеально подходящие под его персонажа.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <среднее арифметическое критериев от 0 до 100>,
        "feedback": "<режиссерский разбор: похвали за удачные актерские решения или укажи, где не хватило драмы/напора. 3-4 предложения>",
        "criteria": {
          "characterMatch": <0-100>,
          "intonation": <0-100>,
          "creativity": <0-100>
        }
      }

      Важные правила:
      - Не используй переносы строк внутри полей "feedback".
      - Не ставь лишних запятых.
      - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') внутри JSON. Для выделения слов используй кавычки-елочки «».`

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
      console.log(
        '🗣️ Сырой ответ от GigaChat (Дубляж):',
        aiJsonResult,
      )

      evaluation = parseAiResponse(aiJsonResult, {
        characterMatch: 50,
        intonation: 50,
        creativity: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в мастере дубляжа:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Дубль сохранен, но ИИ-режиссер не смог сформировать разбор. Попробуйте позже.',
        criteria: {
          characterMatch: 50,
          intonation: 50,
          creativity: 50,
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

    // Начисляем прогресс в ветку «харизма и юмор» через новый уникальный алиас 'ai-acting'
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-acting',
      'Мастер дубляжа',
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
      .json({ message: 'Ошибка анализа речи в мастере дубляжа' })
  }
}

export { startPoemActing, responsePoemActing, finishPoemActing }
