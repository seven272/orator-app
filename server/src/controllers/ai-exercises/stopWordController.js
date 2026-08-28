import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

const startStopWord = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body

    const preview = `${exerciseData.task}\n\nЗапрещено использовать слова-паразиты и тематические стоп-слова. \n\nВключайте запись и попробуйте обойти ловушки!`

    await AiExercise.create({
      userId,
      exerciseType: 'stop-word',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startStopWord:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Анти-слова',
      error: error.message,
    })
  }
}

const responseStopWord = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка SaluteSpeech в анти-словах:',
          speechError,
        )
        return res.status(500).json({
          message: 'Не удалось распознать аудиозапись.',
          error: speechError.message,
        })
      }
    }

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'stop-word',
      status: 'active',
    }).sort({ createdAt: -1 })
    if (!session)
      return res.status(400).json({ message: 'Сессия не найдена.' })

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
        answer: 'Вы ничего не сказали...',
        isFinished: true,
        isError: true,
      })
    }

    session.messages.push({ role: 'user', text: userMessage.trim() })
    await session.save()

    return res.status(200).json({
      user_transcript: userMessage.trim(),
      answer:
        'Речь записана, цензор-ИИ начинает проверку на стоп-слова!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responseStopWord:', error)
    res.status(500).json({
      message: 'Ошибка сервера при обработке аудио',
      error: error.message,
    })
  }
}

const finishStopWord = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'stop-word',
      status: 'active',
    }).sort({ createdAt: -1 })
    if (!session)
      return res.status(400).json({ message: 'Сессия не найдена.' })

    const user = await User.findById(userId)
    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

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
        feedback: 'Речь не была произнесена.',
        criteria: { tabooControl: 0, vocabulary: 0, speechPurity: 0 },
      }
      await session.save()
      return res.status(200).json({
        message: 'Завершено без оценки',
        session,
        earnedXp: 0,
      })
    }

    const userSpeechText = userMessages[userMessages.length - 1].text

    const PROMPT = `
      Ты — лингвистический цензор и эксперт по культуре речи.
      Пользователь раскрывал тему: "${session.exerciseData.topic}".

      СПИСОК ЖЕСТКИХ ТАБУ (ищи их и любые их однокоренные формы/падежи/числа):
      1. Слова-паразиты: [${session.exerciseData.tabooParasites.join(', ')}]
      2. Тематические стоп-слова: [${session.exerciseData.tabooThemeWords.join(', ')}]

      Оцени по 100-балльной шкале следующие критерии:
        1. "Соблюдение табу" (tabooControl): Начни со 100 баллов. Вычитай по 20 баллов за каждое пересечение со стоп-словами или словами-паразитами. Если нарушений нет — 100 баллов.
        2. "Богатство словаря" (vocabulary): Оцени, насколько красиво и оригинально пользователь обошел стоп-слова, используя синонимы, описательные обороты и метафоры.
        3. "Чистота речи" (speechPurity): Снижай баллы, если в тексте от STT зафиксированы заминки, повторы слов, мычание или маркеры неуверенности.

      Верни СТРОГО JSON:
      {
        "totalScore": <средний балл от 0 до 100>,
        "feedback": "<четкий разбор. Укажи, какие именно запрещенные слова проскочили, если они были. Похвали за крутые синонимы. 3-4 предложения>",
        "criteria": {
          "tabooControl": <0-100>,
          "vocabulary": <0-100>,
          "speechPurity": <0-100>
        }
      }
      Категорически запрещено использовать одинарные кавычки (') и переносы строк внутри JSON.`

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

      let aiJsonResult = response.data?.choices?.[0]?.message?.content

      evaluation = parseAiResponse(aiJsonResult, {
        tabooControl: 50,
        vocabulary: 50,
        speechPurity: 50,
      })
    } catch (e) {
      console.error(e)
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback: 'ИИ не смог распознать JSON, но речь сохранена.',
        criteria: {
          tabooControl: 50,
          vocabulary: 50,
          speechPurity: 50, 
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

    // В SKILLS_MAP для "находчивость" привязан алиас 'taboo'
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-stop-word',
      'Анти-слова',
      isDaily,
    )
 
    res
      .status(200)
      .json({ message: 'Успешно', session, ...gamificationResult })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export { startStopWord, responseStopWord, finishStopWord }
