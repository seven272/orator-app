import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import mongoose from 'mongoose'

import LiveDuel from '../models/LiveDuel.js'
import User from '../models/User.js'
import { getXpThreshold } from '../utils/gamificationProgress.js'
import { checkAchievements } from '../utils/achievementService.js'
import generateDuelData from '../utils/liveDuelTopicSelector.js'
import { DUEL_TOPICS } from '../constants/duelTopics.js'

/**
 * Вспомогательный хелпер удаления файла при ошибках валидации
 */
const removeFileOnError = (filePath) => {
  if (!filePath) return
  fs.unlink(path.resolve(filePath), (err) => {
    if (err) {
      console.error(
        `[Multer Safety Cleanup] Ошибка удаления файла: ${filePath}`,
        err,
      )
    } else {
      console.log(
        `[Multer Safety Cleanup] Успешно удален файл после ошибки: ${filePath}`,
      )
    }
  })
}

// Инициализация комнаты (для Быстрого поиска, Ссылки или Календаря)
const createRoom = async (req, res) => {
  try {
    const { creationType } = req.body // Из тела запроса scheduledAt больше не нужен
    const userId = req.userId

    // Валидация типов создания (допустимы только моментальный поиск и прямая ссылка)
    if (!['quick_search', 'direct_link'].includes(creationType)) {
      return res.status(400).json({
        success: false,
        message:
          'Недопустимый тип создания комнаты. Календарь больше не поддерживается.',
      })
    }

    // Собираем объект roomData строго под новую концепцию асинхронных аудио-баттлов
    const roomData = {
      userA: userId,
      userB: null,
      creationType,
      topic: generateDuelData(),
      status: 'pending',
      audioTracks: [], // 🚀 Инициализируем пустой массив для будущих аудиосообщений
    }

    // Если создается комната по прямой ссылке — генерируем токен
    if (creationType === 'direct_link') {
      roomData.inviteToken = crypto.randomBytes(8).toString('hex')
    }

    const room = await LiveDuel.create(roomData)

    return res.status(201).json({ success: true, room })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// Подключение Игрока Б (Вход по ссылке-инвайту или через быстрый поиск)
const joinRoom = async (req, res) => {
  try {
    const { inviteToken, roomId } = req.body
    const userBId = req.userId

    let room

    // 1. Поиск комнаты в зависимости от сценария входных данных
    if (inviteToken) {
      room = await LiveDuel.findOne({
        inviteToken,
        status: 'pending',
      })
    } else if (roomId) {
      room = await LiveDuel.findById(roomId)
    } else {
      // Быстрый поиск: ищем свободную комнату, где создатель НЕ текущий пользователь
      room = await LiveDuel.findOne({
        creationType: 'quick_search',
        status: 'pending',
        userA: { $ne: userBId },
      })
    }

    if (!room && !inviteToken && !roomId) {
      return res.status(200).json({ success: true, room: null })
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Комната не найдена или была удалена',
      })
    }

    if (room.userA.toString() === userBId.toString()) {
      return res.status(200).json({
        success: true,
        message: 'Вы уже являетесь создателем этой комнаты',
        room,
      })
    }

    if (room.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message:
          'Эта комната уже занята другим оратором или завершена',
      })
    }

    // === УСПЕШНОЕ СОЕДИНЕНИЕ ИГРОКА Б ===
    room.userB = userBId
    room.status = 'active'

    await room.save()

    const populatedRoom = await LiveDuel.findById(room._id)
      .populate('userA', 'displayName firstName avatar')
      .populate('userB', 'displayName firstName avatar')
      .populate('audioTracks.sender', 'displayName firstName avatar')

    return res.status(200).json({
      success: true,
      message: 'Пара успешно создана, баттл начинается',
      room: populatedRoom,
    })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// Новый чистый контроллер только для ПУЛЛИНГА
const checkRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.body // Получаем ID комнаты

    if (!roomId) {
      return res
        .status(400)
        .json({ success: false, message: 'ID комнаты не передан' })
    }

    const room = await LiveDuel.findById(roomId)
      // Раскрываем данные создателя комнаты (User A)
      .populate('userA', 'displayName firstName avatar')
      // Раскрываем данные оппонента (User B)
      .populate('userB', 'displayName firstName avatar')
      // 🚀 САМОЕ ВАЖНОЕ: Раскрываем данные автора каждого аудио-трека внутри массива
      .populate('audioTracks.sender', 'displayName firstName avatar')

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Комната не найдена' })
    }

    // Просто отдаем комнату в ее текущем состоянии (pending, active, etc.)
    return res.status(200).json({ success: true, room })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

const submitRating = async (req, res) => {
  try {
    const { roomId, rating } = req.body
    const userId = req.userId

    if (!roomId) {
      return res
        .status(400)
        .json({ success: false, message: 'roomId обязателен' })
    }

    const room = await LiveDuel.findById(roomId)
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Комната не найдена' })
    }

    // Маркируем факт отправки формы пользователем.
    // Если rating === null (нажали Пропустить), записываем в базу специальный маркер -1,
    // чтобы отличить проголосовавшего от того, кто вообще еще не делал выбор (у кого дефолтный null)
    const finalRatingValue = rating !== null ? rating : -1

    // Защита от накрутки наград и фиксация оценок
    if (room.userA.toString() === userId.toString()) {
      if (room.ratingFromA !== null) {
        return res.status(400).json({
          success: false,
          message: 'Вы уже завершили этот поединок',
        })
      }
      room.ratingFromA = finalRatingValue
    } else if (
      room.userB &&
      room.userB.toString() === userId.toString()
    ) {
      if (room.ratingFromB !== null) {
        return res.status(400).json({
          success: false,
          message: 'Вы уже завершили этот поединок',
        })
      }
      room.ratingFromB = finalRatingValue
    } else {
      return res.status(403).json({
        success: false,
        message: 'Вы не участник этой комнаты',
      })
    }

    // 🚀 ЖЕЛЕЗОБЕТОННЫЙ ТРИГГЕР ЗАВЕРШЕНИЯ:
    // Комната завершена, если оба участника совершили действие (выставили балл ИЛИ нажали "Пропустить", то есть у обоих поля больше не равны дефолтному null)
    const isAActionDone = room.ratingFromA !== null
    const isBActionDone = room.userB
      ? room.ratingFromB !== null
      : true

    if (isAActionDone && isBActionDone) {
      room.status = 'completed'
    }

    await room.save()

    // 🚀 УМНОЕ ЗАНУЛЕНИЕ ПАМЯТИ (Выполняется строго при окончательном завершении баттла)
    if (
      room.status === 'completed' &&
      room.audioTracks &&
      room.audioTracks.length > 0
    ) {
      console.log(
        `[Server Storage] Старт зануления памяти для комнаты: ${roomId}`,
      )

      room.audioTracks.forEach((track) => {
        if (track.fileUrl) {
          // track.fileUrl содержит относительную строку вида "audio/1790591466565-voice.ogg"
          // Склеиваем корневую папку загрузок и относительный путь из базы данных
          // На выходе получим точный системный путь: "./src/uploads/audio/1790591466565-voice.ogg"
          const absolutePath = path.resolve(
            './src/uploads',
            track.fileUrl,
          )

          fs.unlink(absolutePath, (err) => {
            if (err) {
              console.error(
                `[Server Storage] Ошибка удаления аудио-трека (${absolutePath}):`,
                err.message,
              )
            } else {
              console.log(
                `[Server Storage] Временный аудио-файл успешно удален: ${absolutePath}`,
              )
            }
          })
        }
      })
    }

    // --- БЛОК ГЕЙМИФИКАЦИИ И НАГРАД ПОЛЬЗОВАТЕЛЯ ---
    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден' })
    }

    // Расчет календарного стрика активности (UTC 00:00:00)
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

    if (!lastDate) {
      user.streak.current = 1
    } else if (todayMs === lastDate + oneDayInMs) {
      user.streak.current += 1
    } else if (todayMs > lastDate + oneDayInMs) {
      user.streak.current = 1
    }
    user.streak.lastCompletedDate = now

    // Вычисление множителя опыта за серию дней
    let multiplier = 1
    if (user.streak.current >= 5) multiplier = 1.2

    // Фиксированные базовые награды за живую дуэль
    const baseRewardXp = 50
    const baseRewardCoins = 5

    // Итоговые награды с учетом буста за стрик дней
    const earnedXp = Math.round(baseRewardXp * multiplier)
    const earnedCoins = Math.round(baseRewardCoins * multiplier)

    // Обновляем начисленные очки оратора в документе комнаты (для истории)
    if (room.userA.toString() === userId.toString()) {
      room.pointsEarnedA = earnedXp
    } else {
      room.pointsEarnedB = earnedXp
    }
    await room.save()

    // Начисление наград в документ пользователя
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

    // Запись статистики для паутинки навыков
    const exAlias = 'live-duel'
    const fixedDuelScore = 50 // 150 баллов за факт участия

    const statIndex = user.stats.exerciseStats.findIndex(
      (ex) => ex.alias === exAlias,
    )
    if (statIndex > -1) {
      user.stats.exerciseStats[statIndex].completionsCount += 1
      user.stats.exerciseStats[statIndex].totalPoints +=
        fixedDuelScore
    } else {
      user.stats.exerciseStats.push({
        alias: exAlias,
        title: 'Голосовой баттл', // Сменили название под новую концепцию
        totalPoints: fixedDuelScore,
        completionsCount: 1,
      })
    }

    // Проверка ачивок
    const newAwards = checkAchievements(
      user,
      false,
      fixedDuelScore,
      exAlias,
    )
    user.progression.lastAwarded =
      newAwards && newAwards.length > 0 ? newAwards : []

    await user.save()

    const completedDays = [
      ...new Set(
        user.dailyProgress
          .filter((item) => item.isCompleted === true)
          .map((item) => item.date),
      ),
    ]

    return res.status(200).json({
      success: true,
      message: 'Результаты приняты, награды успешно обновлены.',
      room,
      earnedXp,
      earnedCoins,
      isLevelUp,
      newAchievements: newAwards || [],
      dailyTaskUpdate: null,
      stats: {
        level: user.progression.level,
        xp: user.progression.xp,
        coins: user.progression.coins,
        streak: user.streak.current,
        completed_days: completedDays,
        nextThreshold: getXpThreshold(user.progression.level),
      },
    })
  } catch (error) {
    console.error('Ошибка в submitRating:', error)
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// Контроллер для предварительной проверки ссылки
const checkInviteToken = async (req, res) => {
  try {
    const { token } = req.params

    // Ищем активную комнату, которая создана по ссылке и еще ждет игрока
    const room = await LiveDuel.findOne({
      inviteToken: token,
      status: 'pending',
    }).populate('userA', 'displayName avatar') // подтянем данные Создателя, чтобы показать Гостю на экране входа

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          'Ссылка недействительна, комната уже занята или удалена.',
      })
    }

    return res.status(200).json({ success: true, room })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// Контроллер для проверки статуса выставления оценок после завершения дуэли
const checkRatingStatus = async (req, res) => {
  try {
    const { roomId } = req.params
    const currentUserId = req.userId

    const room = await LiveDuel.findById(roomId)
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Комната не найдена' })
    }

    let rawYourRating = null
    let rawOpponentRating = null

    // Разделяем оценки в зависимости от того, кто спрашивает
    if (room.userA.toString() === currentUserId.toString()) {
      rawYourRating = room.ratingFromA
      rawOpponentRating = room.ratingFromB
    } else if (
      room.userB &&
      room.userB.toString() === currentUserId.toString()
    ) {
      rawYourRating = room.ratingFromB
      rawOpponentRating = room.ratingFromA
    } else {
      return res
        .status(403)
        .json({ success: false, message: 'Доступ запрещен' })
    }

    // 🚀 АДАПТАЦИЯ ДЛЯ ФРОНТЕНДА: Преобразуем маркеры пропуска (-1)
    // в текстовый статус, при этом обычные оценки (1-5) или отсутствие выбора (null) оставляем как есть
    const yourRatingToOpponent =
      rawYourRating === -1 ? 'пропущено' : rawYourRating
    const opponentRatingToYou =
      rawOpponentRating === -1 ? 'пропущено' : rawOpponentRating

    res.json({
      success: true,
      data: {
        yourRatingToOpponent, // Наша оценка оппоненту (число, null или 'пропущено')
        opponentRatingToYou, // Оценка оппонента нам (число, null или 'пропущено')
      },
    })
  } catch (error) {
    console.error('Ошибка в checkRatingStatus:', error)
    res
      .status(500)
      .json({ success: false, message: 'Ошибка сервера' })
  }
}

const getLiveDuelStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId)

    // 1. Быстрый агрегационный запрос только для расчета общих цифр и распределения оценок
    const stats = await LiveDuel.aggregate([
      {
        $match: {
          status: 'completed',
          $or: [{ userA: userId }, { userB: userId }],
        },
      },
      {
        $project: {
          receivedRating: {
            $cond: {
              if: { $eq: ['$userA', userId] },
              then: '$ratingFromB',
              else: '$ratingFromA',
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          ratedRoomsCount: {
            $sum: {
              $cond: [{ $ne: ['$receivedRating', null] }, 1, 0],
            },
          },
          averageRating: {
            $avg: {
              $cond: [
                { $ne: ['$receivedRating', null] },
                '$receivedRating',
                '$$REMOVE',
              ],
            },
          },
          allRatings: { $push: '$receivedRating' }, // Собираем только массив оценок (числа)
        },
      },
    ])

    // Если у пользователя вообще еще нет завершенных комнат
    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 5.0,
          totalRooms: 0,
          feedbackRate: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          history: [],
        },
      })
    }

    const data = stats[0]

    // 2. Считаем распределение оценок по звездам (1-5)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    data.allRatings.forEach((r) => {
      if (r >= 1 && r <= 5) distribution[r]++
    })

    // Процент комнат, где пользователю оставили отзыв
    const feedbackRate =
      data.totalRooms > 0
        ? Math.round((data.ratedRoomsCount / data.totalRooms) * 100)
        : 0

    // 3. ОТДЕЛЬНЫЙ ОПТИМИЗИРОВАННЫЙ ЗАПРОС: Достаем строго 1 самую свежую дуэль
    const lastRoom = await LiveDuel.findOne({
      status: 'completed',
      $or: [{ userA: userId }, { userB: userId }],
    })
      .sort({ createdAt: -1 }) // Сортируем на уровне индекса базы данных (очень быстро)
      .limit(1)

    // Формируем массив истории из одного элемента в том формате, который ожидал ваш фронтенд
    const history = []
    if (lastRoom) {
      const isUserA = lastRoom.userA.toString() === userId.toString()
      history.push({
        topic: lastRoom.topic?.title || 'Без темы',
        rating: isUserA ? lastRoom.ratingFromB : lastRoom.ratingFromA,
        date: lastRoom.createdAt,
        points: isUserA
          ? lastRoom.pointsEarnedA
          : lastRoom.pointsEarnedB,
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        averageRating: data.averageRating
          ? Number(data.averageRating.toFixed(2))
          : 5.0,
        totalRooms: data.totalRooms,
        feedbackRate,
        distribution,
        history,
      },
    })
  } catch (error) {
    console.error('Ошибка в getLiveDuelStats:', error)
    return res
      .status(500)
      .json({ success: false, message: 'Ошибка сервера' })
  }
}

const uploadAudioTrack = async (req, res) => {
  try {
    const { roomId } = req.body
    const userId = req.userId

    // 1. Проверяем, пропустил ли мидлвар Мультера файл
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'Аудиофайл не найден или не прошел фильтрацию форматов.',
      })
    }

    // 2. Ищем комнату в базе данных
    const room = await LiveDuel.findById(roomId)
    if (!room) {
      removeFileOnError(req.file.path) // Атомарная зачистка при отсутствии сущности
      return res.status(404).json({
        success: false,
        message: 'Комната не найдена.',
      })
    }

    // 3. Валидация фазы поединка
    if (room.status !== 'active') {
      removeFileOnError(req.file.path)
      return res.status(400).json({
        success: false,
        message:
          'Баттл не находится в активной фазе обмена репликами.',
      })
    }

    // 4. Проверка прав доступа участников
    const isUserA = room.userA?.toString() === userId.toString()
    const isUserB = room.userB?.toString() === userId.toString()

    if (!isUserA && !isUserB) {
      removeFileOnError(req.file.path)
      return res.status(403).json({
        success: false,
        message:
          'Вы не являетесь зарегистрированным участником этой дуэли.',
      })
    }

    // 5. Контроль очередности ходов на базе четности массива audioTracks
    const tracksCount = room.audioTracks ? room.audioTracks.length : 0

    // Если треков четное количество (0, 2, 4...) — должен ходить Игрок А
    if (tracksCount % 2 === 0 && !isUserA) {
      removeFileOnError(req.file.path)
      return res.status(400).json({
        success: false,
        message: 'Нарушение очередности. Сейчас ход Спикера А.',
      })
    }

    // Если треков нечетное количество (1, 3, 5...) — должен ходить Игрок Б
    if (tracksCount % 2 !== 0 && !isUserB) {
      removeFileOnError(req.file.path)
      return res.status(400).json({
        success: false,
        message: 'Нарушение очередности. Сейчас ход Спикера Б.',
      })
    }

    // 6. Формируем fileUrl. Мультер при diskStorage сохраняет локальный путь в req.file.path
    // Пример: "src/uploads/audio/1726000000000-random-voice.webm"
    const fileUrl = `audio/${req.file.filename}`
    console.log(fileUrl)

    // 7. Пушим трек в массив документов комнаты
    room.audioTracks.push({
      sender: userId,
      fileUrl: fileUrl,
      timestamp: new Date(),
    })

    await room.save()

    return res.status(200).json({
      success: true,
      message: 'Реплика успешно добавлена в баттл.',
      audioTracks: room.audioTracks,
    })
  } catch (error) {
    // В случае непредвиденного падения базы или сервера удаляем только что загруженный файл
    if (req.file && req.file.path) {
      removeFileOnError(req.file.path)
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export {
  createRoom,
  joinRoom,
  checkRoomStatus,
  submitRating,
  uploadAudioTrack,
  checkInviteToken,
  checkRatingStatus,
  getLiveDuelStats,
}
