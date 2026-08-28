// controllers/liveRoomAiController.js
import LiveDuel from '../models/LiveDuel.js' // Новое имя модели
import User from '../models/User.js'
import gigachatAxiosClient from '../utils/gigachatAxiosClient.js'
import { parseAiResponse } from '../utils/aiJsonParser.js'
import { getXpThreshold } from '../utils/fnForControllers.js'
import { transcribeShortAudio } from '../utils/salutSpeechAxiosClient.js'

// --- 1. ФОЛБЭК НА ИИ-БОТА (Перенесен сюда и адаптирован) ---
const startLiveDuelAi = async (req, res) => {
  try {
    const { roomId } = req.body
    const room = await LiveDuel.findById(roomId)

    if (!room || room.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Невозможно переключить комнату на ИИ',
      })
    }

    // Записываем свойства строго под схему
    room.isAiBot = true
    room.status = 'active'
    room.vkCallLink = ''

    // Стартовая реплика от ИИ-оппонента
    const aiFirstGreeting = `Привет! Я твой ИИ-оппонент на сегодня. Наша тема: "${room.topic.title}". Моя позиция: "${room.topic.sideB}".  Твоя позиция: "${room.topic.sideA}".  Начинай свой монолог, я внимательно слушаю!`

    // Инициализируем массив сообщений под ИИ-сессию (новое название поля)
    room.messagesAi = [
      {
        sender: 'userB', // ИИ выступает как оппонент B
        text: aiFirstGreeting,
        timestamp: new Date(),
      },
    ]

    await room.save()

    return res.status(200).json({
      success: true,
      message: 'Подключен ИИ-бот',
      room,
      aiGreeting: aiFirstGreeting, // Ключ для extraReducers слайса
    })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// --- 2. ОТПРАВКА СООБЩЕНИЯ И ХОД ИИ ---
const sendLiveDuelAiMessage = async (req, res) => {
  try {
    const { roomId } = req.body
    const userId = req.userId

    // 1. Ищем активную ИИ-комнату
    const room = await LiveDuel.findOne({
      _id: roomId,
      status: 'active',
      isAiBot: true,
    })
    if (!room)
      return res
        .status(404)
        .json({
          success: false,
          message: 'Активная ИИ-комната не найдена',
        })

    // 2. Проверяем наличие аудиофайла от Multer
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ success: false, message: 'Аудиофайл не получен' })
    }

    // 3. Отправляем буфер speech.wav на распознавание текста (STT)
    let userMessageText = ''
    try {
      userMessageText = await transcribeShortAudio(req.file.buffer)
    } catch (sttError) {
      console.error('Ошибка STT Сбера в живой дуэли:', sttError)
      return res
        .status(500)
        .json({
          success: false,
          message: 'Не удалось распознать речь',
        })
    }

    if (!userMessageText || userMessageText.trim() === '') {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Речь не распознана, попробуйте сказать громче',
        })
    }

    const cleanUserMessage = userMessageText.trim()

    // 4. Записываем распознанный ход пользователя (Выступает как userA)
    room.messagesAi.push({
      sender: 'userA',
      text: cleanUserMessage,
      timestamp: new Date(),
    })

    // Вычисляем номер текущего хода по репликам пользователя
    const userTurnsCount = room.messagesAi.filter(
      (t) => t.sender === 'userA',
    ).length
    const isLastTurn = userTurnsCount >= 3 // Игрок делает ровно 3 хода

    if (isLastTurn) {
      await room.save()
      return res.status(200).json({
        success: true,
        userText: cleanUserMessage,
        answer: null, // Ответ ИИ отсутствует, так как дуэль завершена
        isFinished: true,
      })
    }

    // 5. Формируем промпт для GigaChat-2 на базе вашей схемы топиков
    const PROMPT = `Ты — опытный и язвительный оппонент в живых дебатах на тему: "${room.topic.title}".
Твоя позиция: "${room.topic.sideB}". Позиция пользователя: "${room.topic.sideA}".
Пользователь утверждает: "${cleanUserMessage}".
Приведи ОДИН сильный контраргументационный довод или задай провокационный вопрос по теме. 
Ответ должен быть коротким (2-4 предложения), живым, без вежливых вступлений и приветствий.`

    // 6. Запрос к вашей языковой модели
    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    const aiAnswer =
      response.data.choices?.[0]?.message?.content ||
      'Интересная мысль, продолжай.'

    // 7. Записываем ответ ИИ-бота (Выступает как userB)
    room.messagesAi.push({
      sender: 'userB',
      text: aiAnswer,
      timestamp: new Date(),
    })

    await room.save()

    // Имитируем задержку мышления для реализма перед финальным ответом
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000),
    )

    // Возвращаем распознанный текст и ответ ИИ фронтенду
    return res.status(200).json({
      success: true,
      userText: cleanUserMessage, // Возвращаем, чтобы фронт вывел в чат то, что наговорил юзер
      answer: aiAnswer,
      isFinished: isLastTurn,
    })
  } catch (error) {
    console.error('Ошибка обработки аудио-хода в живой дуэли:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Ошибка при обработке хода ИИ',
      })
  }
}

// --- 3. ФИНАЛИЗАЦИЯ И СУДЕЙСТВО СЕССИИ ---
const finishLiveDuelAi = async (req, res) => {
  try {
    const { roomId } = req.body
    const userId = req.userId

    const room = await LiveDuel.findOne({
      _id: roomId,
      status: 'active',
      isAiBot: true,
    })
    if (!room)
      return res
        .status(404)
        .json({ success: false, message: 'Комната не найдена' })

    const user = await User.findById(userId)
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден' })

    // 1. Закрываем игровую комнату в БД
    room.status = 'completed'
    room.pointsEarnedA = 150 // Наша статичная логика для баланса паутинки навыков
    await room.save()

    // 2. РАСЧЕТ НАГРАД И СТРИКОВ (Сохраняем всю вашу логику геймификации)
    const now = new Date()
    const todayMs = new Date(now).setUTCHours(0, 0, 0, 0)
    const lastDate = user.streak.lastCompletedDate
      ? new Date(user.streak.lastCompletedDate).setUTCHours(
          0,
          0,
          0,
          0,
        )
      : null
    const oneDayInMs = 86400000

    if (!lastDate) user.streak.current = 1
    else if (todayMs === lastDate + oneDayInMs)
      user.streak.current += 1
    else if (todayMs > lastDate + oneDayInMs) user.streak.current = 1

    user.streak.lastCompletedDate = now

    let multiplier = 1
    if (user.streak.current >= 3) multiplier = 1.2
    if (user.streak.current >= 7) multiplier = 1.5

    const baseRewardXp = 150
    const baseRewardCoins = 15
    const earnedXp = Math.round(baseRewardXp * multiplier)
    const earnedCoins = Math.round(baseRewardCoins * multiplier)

    user.stats.lifetimeXp += earnedXp
    user.weeklyXp += earnedXp
    user.progression.xp += earnedXp
    user.progression.coins += earnedCoins
    user.stats.totalExercises = (user.stats.totalExercises || 0) + 1

    // Повышение уровней ("Стакан")
    let isLevelUp = false
    while (
      user.progression.xp >= getXpThreshold(user.progression.level)
    ) {
      user.progression.xp -= getXpThreshold(user.progression.level)
      user.progression.level += 1
      isLevelUp = true
    }

    // Запись в exerciseStats для паутинки навыков (алиас live-duel)
    const exAlias = 'live-duel'
    const statIndex = user.stats.exerciseStats.findIndex(
      (ex) => ex.alias === exAlias,
    )

    if (statIndex > -1) {
      user.stats.exerciseStats[statIndex].completionsCount += 1
      user.stats.exerciseStats[statIndex].totalPoints += 150
    } else {
      user.stats.exerciseStats.push({
        alias: exAlias,
        title: 'Живая дуэль',
        totalPoints: 150,
        completionsCount: 1,
      })
    }

    await user.save()

    // 3. Отправляем ответ без критериев оценки речи оппонента — только поздравление и награды!
    return res.status(200).json({
      success: true,
      congratulations: {
        title: '🎉 Тренировка успешно завершена!',
        message: `Отличная работа! Вы провели полноценную аудио-дуэль с ИИ-Оратором на тему «${room.topic.title}» и совершили все 3 раунда аргументации. Навык «Коммуникация» успешно прокачан.`,
      },
      earnedXp,
      earnedCoins,
      isLevelUp,
      stats: {
        level: user.progression.level,
        xp: user.progression.xp,
        coins: user.progression.coins,
        streak: user.streak.current,
        nextThreshold: getXpThreshold(user.progression.level),
      },
    })
  } catch (error) {
    console.error('Ошибка завершения дуэли с ИИ:', error)
    return res
      .status(500)
      .json({ success: false, message: 'Внутренняя ошибка сервера' })
  }
}

export { startLiveDuelAi, sendLiveDuelAiMessage, finishLiveDuelAi }
