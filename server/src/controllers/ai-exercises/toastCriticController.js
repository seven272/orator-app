import User from '../../models/User.js'
import AiExercise from '../../models/AiExercise.js'
import { applyAiGamificationProgress } from '../../utils/gamificationProgress.js'
import { parseAiResponse } from '../../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../../utils/speechService.js'
import { sendGigaChatRequest } from '../../utils/gigachatService.js'

// 1. СТАРТ УПРАЖНЕНИЯ
const startToastCritic = async (req, res) => {
  try {
    const userId = req.userId
    const { exerciseData } = req.body // Прилетает выбранный сценарий из toastScenarios.js

    // Формируем вводный контекст для экрана
    const preview = `Праздничный повод: "${exerciseData.situation}". \nСобытие: ${exerciseData.event} \nОбязательная композиционная схема: ${exerciseData.schema}`

    // Стартовая реплика ведущего/тамады из сценария
    const question = exerciseData.init_phrase

    // Создаем активную сессию в MongoDB
    await AiExercise.create({
      userId,
      exerciseType: 'ai-toast-critic',
      status: 'active',
      exerciseData: {
        ...exerciseData,
        emotionalResponse: 50, // Стартовый отклик зала (медиана)
      },
      messages: [],
    })

    res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startToastCritic:', error)
    res.status(500).json({
      message:
        'Ошибка сервера при старте упражнения Банкетный критик',
      error: error.message,
    })
  }
}

// 2. АНАЛИЗ ТОСТА (ИГРОВОЙ ПРОЦЕСС)
const generateToastCriticResponse = async (req, res) => {
  try {
    const userId = req.userId
    let userMessage = null

    // Ищем активную сессию тренажера
    let session = await AiExercise.findOne({
      userId: userId,
      exerciseType: 'ai-toast-critic',
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
          'Ошибка SalutSpeech в Банкетном критике:',
          speechError,
        )
        return res.status(500).json({
          message:
            'Не удалось распознать вашу праздничную речь. Пожалуйста, повторите запись.',
          error: speechError.message,
        })
      }
    }

    // Так как тост произносится за один раунд, первая же попытка завершает диалог
    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isLastAttempt = attemptsCount >= 0

    // Обработка молчания
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
          'Вы подняли бокал, но не проронили ни слова... Гости переглядываются в тишине. Скажите же что-нибудь!',
        isFinished: false,
        emotionalResponse: session.exerciseData.emotionalResponse,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const currentResponse =
      Number(session.exerciseData.emotionalResponse) || 50

    // Системный промпт для ИИ-судьи
    const PROMPT = `Ты — харизматичный, красноречивый тамада на веселом застолье или один из самых ярких гостей на празднике. Ты сидишь за столом и в реальном времени реагируешь на тост, который только что произнес твой товарищ.

КОНТЕКСТ ПРАЗДНИКА:
- Повод для тоста: "${session.exerciseData.situation}"
- Детали события: "${session.exerciseData.event}"

ТЕКУЩАЯ АТМОСФЕРА ЗА СТОЛОМ (Отклик гостей): ${currentResponse} из 100.
1. Если отклик < 40 (застолье тухнет): гости сидят в легком недоумении, кто-то ковыряет вилкой салат. Отреагируй с легкой иронией, подбодри оратора, скажи, что надо выпить побыстрее, пока всё не остыло.
2. Если отклик 40-70 (нормальная атмосфера): отреагируй живо, поддержи его мысль, добродушно пошути в тему праздника, крикните общее одобрение.
3. Если отклик > 70 (зал в восторге): реакция должна быть максимально бурной! Крикни «Горько!», «Ура!» или «За это точно пьем стоя!», скажи, что тост попал прямо в сердце и у всех мурашки.

⚠️ СТРОЖАЙШИЕ ПРАВИЛА ФОРМАТА ТВОЕГО ОТВЕТА (ЗА НАРУШЕНИЕ — БАН):
1. Пиши СТРОГО ОТ ПЕРВОГО ЛИЦА, как живой человек, кричащий с другого конца стола или говорящий в микрофон.
2. ЗАПРЕЩЕНО писать от третьего лица (например: "Тамада рассмеялся", "зал зааплодировал"). Только твоя прямая речь.
3. ЗАПРЕЩЕНО использовать заумные слова, термины вроде "структура", "композиция", "критерии", "УТП" или "клише". Ты на празднике, а не на экзамене!
4. Никаких тире перед репликой ("— ...") и никаких вводных слов вроде "Тамада:".
5. Текст должен быть очень коротким (1-2 емкие фразы), живым, разговорным и бить точно по смыслу тоста пользователя.

Пользователь только что поднял бокал и произнес: "${cleanUserMessage}". Выдай свою спонтанную реакцию.

В САМОМ КОНЦЕ ответа строго добавь маркер изменения уровня отклика зала: ###+число или ###-число (от -15 до +25 в зависимости от того, насколько душевным, смешным или уместным был тост).
Пример идеального ответа: "Вот это я понимаю — задвинул от души! Умеешь же, когда хочешь! Мужики, за такие слова грех не бахнуть стоя, наливай! ###+20"`

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

    // Парсим маркер изменения отклика зала
    const emotionalMatch = aiRawAnswer.match(/###\s?([+-]?\d+)/)
    const emotionalChange = emotionalMatch
      ? parseInt(emotionalMatch[1], 10)
      : 0

    let cleanAnswer = aiRawAnswer.replace(/###\s?[+-]?\d+/, '').trim()

    // Защитный фоллбек текста
    if (!cleanAnswer) {
      if (emotionalChange > 0) {
        cleanAnswer =
          'Отличные слова! За это точно стоит выпить, кричат гости!'
      } else {
        cleanAnswer =
          'Ну, за здоровье! Гости вежливо пригубили бокалы в легком замешательстве.'
      }
    }

    // Высчитываем новую шкалу отклика в рамках 0-100
    let newResponse = currentResponse + emotionalChange
    newResponse = Math.min(Math.max(newResponse, 0), 100)

    // Запись шага в базу данных
    session.exerciseData.emotionalResponse = newResponse
    session.markModified('exerciseData')
    session.messages.push({ role: 'user', text: userMessage })
    session.messages.push({ role: 'assistant', text: cleanAnswer })

    await session.save()

    // Микро-задержка для имитации "реакции зала"
    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(800)

    res.json({
      user_transcript: cleanUserMessage,
      answer: cleanAnswer,
      emotionalResponse: newResponse,
      isFinished: isLastAttempt,
    })
  } catch (error) {
    console.error(
      'Toast Critic AI Error:',
      error.response?.data || error.message,
    )
    res.status(503).json({
      answer:
        'Микрофон тамады фонит, а колонки отключились из-за сбоя в сети аудиоаппаратуры ресторана.',
    })
  }
}

const finishToastCritic = async (req, res) => {
  try {
    const userId = req.userId
    const { isDaily } = req.body

    // Ищем активную сессию для Банкетного критика
    const session = await AiExercise.findOne({
      userId,
      exerciseType: 'ai-toast-critic',
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
          'Вы подняли бокал, но так и не произнесли тост. Застолье завершилось в недоумении.',
        criteria: {
          structure_match: 0,
          humor_charisma: 0,
          no_cliches: 0,
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

    // Собираем историю выступления для анализа искусственным интеллектом
    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Оратор' : 'Критик'}: ${m.text}`,
      )
      .join('\n')

    // Оценочный промпт по критериям праздничной ораторской драматургии
    const EVALUATION_PROMPT = `Ты — строгий, авторитетный банкетный критик и тамада-эксперт. Проанализируй праздничный тост, который произнес Пользователь на мероприятии: "${session.exerciseData.situation}".

ОБЯЗАТЕЛЬНАЯ СХЕМА КОМПОЗИЦИИ, КОТОРУЮ ОРАТОР ДОЛЖЕН БЫЛ СОБЛЮСТИ: "${session.exerciseData.schema}".

Оцени по 100-балльной шкале следующие критерии:
1. "Соблюдение структуры" (structure_match): Насколько четко в тексте прослеживается заданная трехшаговая схема композиции, есть ли логическое развитие мысли от завязки к финалу.
2. "Юмор и харизма" (humor_charisma): Уровень артистизма, умение вызвать улыбку, оригинальность шуток, душевность и общая энергетика выступления.
3. "Отсутствие штампов" (no_cliches): Насколько оратор избегал избитых, банальных и пошлых открыточных поздравлений из интернета ("желаю счастья в личной жизни", "здоровья, успехов", "чтоб всё было и ничего за это не было").

Верни ответ СТРОГО в формате JSON без лишнего художественного текста, преамбул или Markdown-кода вокруг:
{
  "totalScore": <средний балл от 0 до 100>,
  "feedback": "<краткая емкая рецензия от банкетного критика на 2-3 предложения, оценивающая артистизм тоста и дающая полезный совет на будущее>",
  "criteria": {
    "structure_match": <число 0-100>,
    "humor_charisma": <число 0-100>,
    "no_cliches": <число 0-100>
  }
}`

    let evaluation = null

    try {
      const messages = [
        { role: 'system', content: EVALUATION_PROMPT },
        {
          role: 'user',
          content: `Вот стенограмма застолья:\n${chatHistory}`,
        },
      ]
      const countTokens = 700

      const aiText = await sendGigaChatRequest(messages, countTokens)
      evaluation = parseAiResponse(aiText, {
        structure_match: 50,
        humor_charisma: 50,
        no_cliches: 50,
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при финализации Банкетного критика:',
        apiError.message,
      )
    }

    // Защитный фоллбек на случай обрыва соединения с нейросетью
    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Тост записан на диктофон, но ИИ-арбитр не смог сформировать подробный отчет из-за сбоя связи. Начислен базовый балл за смелость.',
        criteria: {
          structure_match: 50,
          humor_charisma: 50,
          no_cliches: 50,
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

    // Применяем игровой прогресс (опыт, монеты, дейлики) [2]
    const gamificationResult = await applyAiGamificationProgress(
      user,
      evaluation.totalScore,
      'ai-toast-critic',
      'Банкетный критик',
      isDaily,
    )

    res.status(200).json({
      message: 'Упражнение успешно сохранено',
      session,
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка финализации Банкетного критика:', error)
    res.status(500).json({
      message: 'Не удалось завершить упражнение Банкетный критик',
    })
  }
}

export {
  startToastCritic,
  generateToastCriticResponse,
  finishToastCritic,
}
