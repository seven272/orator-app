import dayjs from 'dayjs'
import crypto from 'crypto'
import mongoose from 'mongoose'

import LiveDuel from '../models/LiveDuel.js'
import User from '../models/User.js'
import { getXpThreshold } from '../utils/fnForControllers.js'
import { checkAchievements } from '../utils/achievementService.js'
import generateDuelData from '../utils/liveDuelTopicSelector.js'
import { DUEL_TOPICS } from '../constants/duelTopics.js'

// Вспомогательный хелпер для получения условий "активного" календарного слота
const getActiveCalendarQuery = (userId) => ({
  userA: userId,
  creationType: 'calendar',
  status: 'pending',
  scheduledAt: { $gt: new Date() }, // Слот еще не просрочен
})



// Инициализация комнаты (для Быстрого поиска, Ссылки или Календаря)
const createRoom = async (req, res) => {
  try {
    // Принимаем параметры в формате camelCase из измененного слайса
    const { creationType, scheduledAt } = req.body
    const userId = req.userId

    // Если создается календарный слот — проверяем лимит
    if (creationType === 'calendar') {
      const activeSlotsCount = await LiveDuel.countDocuments(
        getActiveCalendarQuery(userId),
      )

      if (activeSlotsCount >= 3) {
        return res.status(400).json({
          success: false,
          message:
            'Вы не можете создать более 3-х active запланированных слотов одновременно.',
        })
      }
    }

    const randomTopic =
      DUEL_TOPICS[Math.floor(Math.random() * DUEL_TOPICS.length)]

    // Собираем объект roomData строго под новую Mongoose-схему
    const roomData = {
      userA: userId,
      creationType,
      topic: generateDuelData(),
      status: 'pending',
    }

    if (creationType === 'direct_link') {
      roomData.inviteToken = crypto.randomBytes(8).toString('hex')
    }

    if (creationType === 'calendar' && scheduledAt) {
      roomData.scheduledAt = new Date(scheduledAt)
    }

    const room = await LiveDuel.create(roomData)

    return res.status(201).json({ success: true, room })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

//  Подключение Игрока Б (Вход по ссылке-инвайту или через быстрый поиск)
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
      // Быстрый поиск: ищем любую свободную комнату, где создатель НЕ текущий пользователь
      room = await LiveDuel.findOne({
        creationType: 'quick_search',
        status: 'pending',
        userA: { $ne: userBId },
      })
    }

    // 2. Если комната для быстрого поиска не найдена — отдаем пустой room (фронтенд поймет, что нужно создать новую комнату)
    if (!room && !inviteToken && !roomId) {
      return res.status(200).json({ success: true, room: null })
    }

    // 3. Для инвайтов и конкретных ID отсутствие комнаты — это критическая ошибка
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Комната не найдена или была удалена',
      })
    }

    // 4. ЗАЩИТА: Если Создатель (Игрок А) случайно вызвал joinRoom вместо пуллинга
    if (room.userA.toString() === userBId.toString()) {
      return res.status(200).json({
        success: true,
        message: 'Вы уже являетесь создателем этой комнаты',
        room,
      })
    }

    // 5. ЗАЩИТА: Если Игрок Б пытается зайти в комнату, которая уже занята кем-то другим
    if (room.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message:
          'Эта комната уже занята другим оратором или завершена',
      })
    }

    // 6. УСПЕШНОЕ СОЕДИНЕНИЕ: Заполняем данные Игрока Б и активируем комнату
    const vkCallLink = `https://vk.com/${room._id}` // Генерация ссылки на звонок

    room.userB = userBId
    room.status = 'active'
    room.vkCallLink = vkCallLink

    await room.save()

    return res.status(200).json({
      success: true,
      message: 'Пара успешно создана, игра начинается',
      room,
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

    room.status = 'completed'

    // Защита от накрутки наград
    if (room.userA.toString() === userId.toString()) {
      if (room.ratingFromA !== null) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Вы уже получили награду за эту дуэль',
          })
      }
      if (rating) room.ratingFromA = rating
    } else if (
      room.userB &&
      room.userB.toString() === userId.toString()
    ) {
      if (room.ratingFromB !== null) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Вы уже получили награду за эту дуэль',
          })
      }
      if (rating) room.ratingFromB = rating
    } else {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Вы не являетесь участником этой комнаты',
        })
    }

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
    if (user.streak.current >= 3) multiplier = 1.2
    if (user.streak.current >= 7) multiplier = 1.5

    // Фиксированные базовые награды за живую дуэль
    const baseRewardXp = 150
    const baseRewardCoins = 15

    // Итоговые награды с учетом буста за стрик дней
    const earnedXp = Math.round(baseRewardXp * multiplier)
    const earnedCoins = Math.round(baseRewardCoins * multiplier)

    // Сохраняем опыт в документ комнаты
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
    const fixedDuelScore = 150 // Всегда 250 баллов за факт участия независимо от оценки

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
        title: 'Живая дуэль',
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
      message: 'Дуэль успешно завершена, награды начислены',
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

// Получить список всех запланированных дуэлей (Лента объявлений)
const getCalendarRooms = async (req, res) => {
  try {
    const userId = req.userId // ID текущего юзера

    const rooms = await LiveDuel.find({
      creationType: 'calendar',
      status: 'pending',
      scheduledAt: { $gte: new Date() }, // Только будущие сессии
      userA: { $ne: userId }, // Исключаем свои собственные созданные слоты
    })
      .populate('userA', 'displayName avatar') // Подтягиваем имя и аватар создателя
      .sort({ scheduledAt: 1 }) // Сортируем от ближайших к дальним

    return res.status(200).json({ success: true, rooms })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

// Получение личных активных слотов пользователя
const getMyActiveSlots = async (req, res) => {
  try {
    const userId = req.userId

    const slots = await LiveDuel.find({
      creationType: 'calendar',
      scheduledAt: { $gte: new Date() }, // Только будущие
      $or: [
        // Вариант 1: Слот создан мной (и pending, и active)
        { userA: userId, status: { $in: ['pending', 'active'] } },
        // Вариант 2: Я присоединился к чужому слоту (только active)
        { userB: userId, status: 'active' },
      ],
    })
      .populate('userA', 'displayName avatar') // Подтягиваем имя и аватар Игрока А
      .populate('userB', 'displayName avatar') // Подтягиваем имя и аватар Игрока Б
      .sort({ scheduledAt: 1 })

    return res.status(200).json({ success: true, rooms: slots })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

const updateSlotDate = async (req, res) => {
  try {
    // Принимаем параметры в формате camelCase из измененного слайса
    const { roomId, scheduledAt } = req.body
    const userId = req.userId

    if (!scheduledAt) {
      return res
        .status(400)
        .json({ success: false, message: 'Новая дата обязательна' })
    }

    // Ищем строго под новые ключи userA
    const room = await LiveDuel.findOne({
      _id: roomId,
      userA: userId,
      status: 'pending',
    })
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Слот не найден или уже активен/завершен',
      })
    }

    // Записываем новую дату в camelCase поле scheduledAt
    room.scheduledAt = new Date(scheduledAt)
    await room.save()

    return res.status(200).json({
      success: true,
      room,
      message: 'Дата слота успешно изменена',
    })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

const deleteSlot = async (req, res) => {
  try {
    // Параметр из URL (req.params) считываем как roomId
    const { roomId } = req.params
    const userId = req.userId

    // Атомарно находим и удаляем запись с учетом ключа userA
    const room = await LiveDuel.findOneAndDelete({
      _id: roomId,
      userA: userId,
      status: 'pending',
    })
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Слот не найден или не может быть удален',
      })
    }

    return res
      .status(200)
      .json({ success: true, message: 'Слот успешно удален' })
  } catch (error) {
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

    let yourRatingToOpponent = null
    let opponentRatingToYou = null

    // Разделяем оценки в зависимости от того, кто спрашивает
    if (room.userA.toString() === currentUserId.toString()) {
      yourRatingToOpponent = room.ratingFromA
      opponentRatingToYou = room.ratingFromB
    } else if (
      room.userB &&
      room.userB.toString() === currentUserId.toString()
    ) {
      yourRatingToOpponent = room.ratingFromB
      opponentRatingToYou = room.ratingFromA
    } else {
      return res
        .status(403)
        .json({ success: false, message: 'Доступ запрещен' })
    }

    res.json({
      success: true,
      data: {
        yourRatingToOpponent, // null или число
        opponentRatingToYou, // null или число (фронтенд ждет, пока тут появится не null)
        isAiBot: room.isAiBot,
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
        points: isUserA ? lastRoom.pointsEarnedA : lastRoom.pointsEarnedB,
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


export {
  createRoom,
  joinRoom,
  checkRoomStatus,
  submitRating,
  getCalendarRooms,
  getMyActiveSlots,
  updateSlotDate,
  deleteSlot,
  checkInviteToken,
  checkRatingStatus,
  getLiveDuelStats,
}
