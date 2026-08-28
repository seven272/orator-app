import gigachatAxiosClient from '../../utils/gigachatAxiosClient.js'
import AiExercise from '../../models/AiExercise.js'
import User from '../../models/User.js'
import { applyAiGamificationProgress } from '../../utils/fnForControllers.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'

//  Старт упражнения «Радиоведущий»
const startRadioHost = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Объект сценария (id, topic, weather, funnyFact, songTransition)

    // Формируем вводную реплику от ИИ для экрана чата
    const preview = `В эфире радиостанция Риторика-FM! Ты — ведущий утреннего шоу. Тема выхода: «${exerciseData.topic}». \n\nТвоя задача — за 40 секунд провести бодрый эфирный перерыв, связав воедино следующие новости:\n1. Погода: ${exerciseData.weather}\n2. Интересный факт: ${exerciseData.funnyFact}\n3. Подводка к треку: в конце плавно перейди на «${exerciseData.songTransition}».\n\nПомни главное правило радио: ни секунды тишины или мычания! Микрофон включен, поехали!`

    // Создаем активную сессию в БД
    await AiExercise.create({
      userId,
      exerciseType: 'radio-host',
      status: 'active',
      exerciseData,
      messages: [],
    })

    res.status(201).json({ preview })
  } catch (error) {
    console.error('Error in startRadioHost:', error)
    res.status(500).json({
      message: 'Ошибка сервера при старте упражнения Радиоведущий',
      error: error.message,
    })
  }
}

// 2. Обработка аудиозаписи от SaluteSpeech
const responseRadioHost = async (req, res) => {
  const userId = req.userId
  let userMessage = req.body.userMessage

  try {
    if (req.file) {
      try {
        userMessage = await transcribeLongAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка распознавания SalutSpeech в радиоведущем:',
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
      exerciseType: 'radio-host',
      status: 'active',
    }).sort({ createdAt: -1 })

    if (!session) {
      return res.status(400).json({ message: 'Сессия не найдена.' })
    }

    // Защита от тишины в эфире
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
          'В эфире мертвая тишина! Программный директор в ярости, ты сорвал эфирный слот...',
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
        'Прямой эфир завершен. Запись отправлена на пульт программного директора для анализа!',
      isFinished: true,
      isError: false,
    })
  } catch (error) {
    console.error('Error in responseRadioHost:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при обработке аудио в упражнении Радиоведущий',
      error: error.message,
    })
  }
}

// 3. Анализ и формирование вердикта
const finishRadioHost = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    let session = await AiExercise.findOne({
      userId,
      exerciseType: 'radio-host',
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
          'Эфир не состоялся, ведущий промолчал. Оценка невозможна.',
        criteria: {
          tempo: 0,
          pauseless: 0,
          positivity: 0,
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

    // Системный промпт для радио-жюри
    const PROMPT = `
      Ты — опытный программный директор федеральной музыкальной радиостанции с 20-летним стажем.
      Пользователь выступал в роли линейного радиоведущего. Ему нужно было связать в один бодрый монолог следующие данные:
      1. Погода: "${session.exerciseData.weather}"
      2. Факт: "${session.exerciseData.funnyFact}"
      3. Переход на трек: "${session.exerciseData.songTransition}"

      Оцени по 100-балльной шкале следующие критерии на основе расшифровки STT, полученной из прямого эфира:
        1. "Темпоритм" (tempo): Радио требует высокой динамики. 100 баллов, если текст выглядит плотным, а информация подана емко и энергично. Снижай баллы, если речь затянута, а предложения слишком длинные, тяжелые и не подходят для формата развлекательного шоу.
        2. "Непрерывность" (pauseless): Главный враг радио — паузы. Снижай баллы за любые зафиксированные в тексте слова-паразиты (ну, короче, как бы), мычания (эм, мм, ааа), повторы одних и тех же фраз или хаотичные знаки препинания от STT, указывающие на то, что ведущий зависал, подбирая слова.
        3. "Настроение" (positivity): Оцени лексический вайб. Ищи дружелюбные приветствия, бодрые призывы, восклицания (знаки "!" от STT), шутки и плавность логических мостов между погодой, фактом и песней. Если речь звучит уныло, сухо или переходы между темами разорваны — снижай балл.

      Проанализируй текст и верни СТРОГО JSON:
      {
        "totalScore": <средний балл от 0 до 100>,
        "feedback": "<профессиональная рецензия программного директора радиостанции: разбери, насколько удачно ведущий связал факты, не было ли просадок по динамике и «гэгов». Используй радио-сленг вроде «лайнер», «подводка», «эфирное время». 3-4 предложения>",
        "criteria": {
          "tempo": <0-100>,
          "pauseless": <0-100>,
          "positivity": <0-100>
        }
      }

      Важные правила:
      - Не используй переносы строк внутри полей "feedback".
      - Не ставь лишних запятых.
      - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и любые переносы строк внутри JSON-ответа. Если нужно выделить слово или название трека, используй кавычки-елочки «».`

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
      console.log('🗣️ Сырой ответ от GigaChat (Радио):', aiJsonResult)

      evaluation = parseAiResponse(aiJsonResult, {
        tempo: 50,
        pauseless: 50,
        positivity: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat в радио-тренажере:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Эфир записан, но программный пульт ИИ временно недоступен для детальной аналитики. Попробуйте позже.',
        criteria: {
          tempo: 50,
          pauseless: 50,
          positivity: 50,
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

    // Начисляем награды по геймификации (используем уникальный изолированный алиас 'ai-radio-host')
    // Алиас будет биндиться к категории «харизма и юмор» или «техника речи»
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore, 
      'ai-radio-host',
      'Радиоведущий',
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
      .json({ message: 'Ошибка анализа речи на радио-тренажере' })
  }
}

export { startRadioHost, responseRadioHost, finishRadioHost }
