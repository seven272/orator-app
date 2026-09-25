import User from '../models/User.js'
import DailyTask from '../models/DailyTask.js'
import Task from '../models/Task.js'
import { generateWeeklySuperPrize } from '../utils/prizeGenerator.js'
import { trackWeeklyPrize } from '../utils/feedService.js'

const getDailyTasks = async (req, res) => {
  try {
    const isGuest = req.isGuest // Флаг из мидлвары optionalAuth
    const userId = req.userId
    const today = new Date().toISOString().split('T')[0] // Формат "2026-09-24"

    // 1. Ищем, определены ли общие задачи на сегодня
    let challenge = await DailyTask.findOne({ date: today }).populate(
      'tasks',
    )

    // 2. Если на сегодня задач еще нет (первый пользователь за день) — генерируем пул задач
    if (!challenge) {
      const [t1] = await Task.aggregate([
        { $match: { level: 1 } },
        { $sample: { size: 1 } },
      ])
      const [t2] = await Task.aggregate([
        { $match: { level: 2 } },
        { $sample: { size: 1 } },
      ])
      const [t3] = await Task.aggregate([
        { $match: { level: 3 } },
        { $sample: { size: 1 } },
      ])

      // Защита на случай, если коллекция Task пуста в базе
      if (!t1 || !t2 || !t3) {
        return res.status(404).json({
          message:
            'Шаблоны заданий (Task) не найдены в базе данных. Заполните коллекцию.',
        })
      }

      challenge = await DailyTask.create({
        date: today,
        tasks: [t1._id, t2._id, t3._id],
      })

      challenge = await DailyTask.findById(challenge._id).populate(
        'tasks',
      )
    }

    //  СЦЕНАРИЙ А: ПОЛЬЗОВАТЕЛЬ-ГОСТЬ (Сайт или VK)
    if (isGuest || !userId) {
      const tasksForGuest = challenge.tasks.map((task) => {
        return {
          ...task._doc,
          locked: task.premium,
          currentValue: 0,
          isCompleted: false,
        }
      })

      return res.status(200).json({
        date: today,
        tasks: tasksForGuest,
        isGuest: true,
      })
    }

    // СЦЕНАРИЙ Б: АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ
    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или сессия истекла',
      })
    }

    // УМНАЯ ОЧИСТКА: Удаляем историю заданий старше 7 дней, чтобы не раздувать профиль,
    // но сохраняем текущую неделю для расчета недельного супер-приза.
    const SEVEN_DAYS_AGO = new Date()
    SEVEN_DAYS_AGO.setDate(SEVEN_DAYS_AGO.getDate() - 7)
    const limitDateString = SEVEN_DAYS_AGO.toISOString().split('T')[0]

    const hasOldData = user.dailyProgress.some(
      (p) => p.date < limitDateString,
    )
    if (hasOldData) {
      user.dailyProgress = user.dailyProgress.filter(
        (p) => p.date >= limitDateString,
      )
      await user.save()
    }

    // Формируем ответ, совмещая данные задачи и личный прогресс юзера на СЕГОДНЯ
    const tasksWithProgress = challenge.tasks.map((task) => {
      const userProgress = user.dailyProgress.find(
        (p) =>
          p.taskId.toString() === task._id.toString() &&
          p.date === today,
      )

      return {
        ...task._doc,
        locked: task.premium && !user.isPremium, //если задача премиуи и у юзера нет статуса премиума, то задача заблокирована, иначе false
        currentValue: userProgress ? userProgress.currentValue : 0,
        isCompleted: userProgress ? userProgress.isCompleted : false,
        lastWeeklyRewardDate: user.lastWeeklyRewardDate,
      }
    })

    return res.status(200).json({
      date: today,
      tasks: tasksWithProgress,
      isGuest: false,
    })
  } catch (error) {
    console.error('Критическая ошибка в getDailyTasks:', error)
    return res
      .status(500)
      .json({ message: 'Ошибка получения ежедневных заданий' })
  }
}

const claimWeeklySuperPrize = async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({
        message:
          'Действие доступно только авторизованным пользователям',
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // 1. Вычисляем даты текущей недели
    const today = new Date()
    const currentDay = today.getDay()
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1

    const monday = new Date(today)
    monday.setDate(today.getDate() - dayIndex)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const sundayStr = sunday.toISOString().split('T')[0]

    // 2. ЗАЩИТА: Проверяем, не забирал ли уже награду на этой неделе
    if (user.lastWeeklyRewardDate === sundayStr) {
      return res.status(400).json({
        message: 'Вы уже получили призовой сундук за эту неделю!',
      })
    }

    // 3. ПРОВЕРКА ДИСЦИПЛИНЫ
    const requiredDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      requiredDays.push(day.toISOString().split('T')[0])
    }

    const userCompletedDays = [
      ...new Set(
        user.dailyProgress
          .filter((item) => item.isCompleted === true)
          .map((item) => item.date),
      ),
    ]

    const hasPerfectWeek = requiredDays.every((dateStr) =>
      userCompletedDays.includes(dateStr),
    )

    if (!hasPerfectWeek) {
      return res.status(400).json({
        message:
          'Недостаточно выполненных тренировок. Необходимо закрыть все 7 дней недели без пропусков.',
      })
    }

    // 4. ГЕНЕРАЦИЯ ПРИЗА ЧЕРЕЗ ВЫНЕСЕННУЮ УТИЛИТУ
    const prize = await generateWeeklySuperPrize(user)

    // 5. НАЧИСЛЕНИЕ ВЫПАВШЕЙ НАГРАДЫ В ПРОФИЛЬ ЮЗЕРА
    if (prize.type === 'coins') {
      user.progression.coins += prize.amount
    } else if (prize.type === 'item') {
      // Добавление купона ИИ в инвентарь
      const invItem = user.inventory.find(
        (inv) => inv.itemCode === prize.code,
      )
      if (invItem) {
        invItem.quantity += 1
      } else {
        user.inventory.push({
          itemCode: prize.code,
          quantity: 1,
          purchasedAt: new Date(),
        })
      }
    } else if (prize.type === 'premium') {
      const ONE_HOUR = 60 * 60 * 1000
      const now = new Date()
      const currentExpiry =
        user.isPremium &&
        user.premiumExpiresAt &&
        user.premiumExpiresAt > now
          ? user.premiumExpiresAt.getTime()
          : now.getTime()

      user.isPremium = true
      user.premiumExpiresAt = new Date(currentExpiry + ONE_HOUR)
    } else if (prize.type === 'course') {
      user.activePurchasedCourses.push(prize.code)
    } else if (prize.type === 'achievement') {
      // ищем, есть ли уже ачивка с таким кодом в массиве объектов
      const hasAchievement = user.progression.achievements.some(
        (ach) => ach.code === prize.code,
      )

      if (hasAchievement) {
        // Утешительный приз, если такое звание уже выиграно ранее
        user.progression.coins += 500
        // Меняем title приза, чтобы фронтенд в модалке показал компенсацию
        prize.title = '500 жетонов оратора'
      } else {
        // Если звание уникальное — добавляем в профиль
        const achievement = {
          title: prize.title,
          code: prize.code,
          unlockedAt: new Date(),
        }
        user.progression.achievements.push(achievement)
      }
    } else {
      return res
        .status(500)
        .json({ message: 'Сгенерирован неизвестный тип награды' })
    }

    // Фиксируем дату забора приза для предотвращения абуза
    user.lastWeeklyRewardDate = sundayStr

    await user.save()

    trackWeeklyPrize(user._id, prize.title)

    return res.status(200).json({
      success: true,
      message: 'Вы успешно открыли призовой сундук!',
      prize,
      lastWeeklyRewardDate: user.lastWeeklyRewardDate,
      coins: user.progression.coins,
      inventory: user.inventory,
      activePurchasedCourses: user.activePurchasedCourses,
      achievements: user.progression.achievements,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
    })
  } catch (error) {
    console.error(
      'Ошибка в контроллере claimWeeklySuperPrize:',
      error,
    )
    return res
      .status(500)
      .json({ message: 'Внутренняя ошибка сервера' })
  }
}


//тестовый контроллер
// const claimWeeklySuperPrize = async (req, res) => {
//   try {
//     const userId = req.userId
//     if (!userId) {
//       return res
//         .status(401)
//         .json({
//           message:
//             'Действие доступно только авторизованным пользователям',
//         })
//     }

//     const user = await User.findById(userId)
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: 'Пользователь не найден' })
//     }

//     // ==========================================
//     // 🎯 ВРЕМЕННЫЙ ХАРДКОД ДЛЯ ТЕСТИРОВАНИЯ
//     // ==========================================

//     // 1. Искусственно переносим сервер на Воскресенье, 27 сентября 2026 года
//     const today = new Date('2026-09-27T12:00:00Z')
//     const currentDay = today.getDay()
//     const dayIndex = currentDay === 0 ? 6 : currentDay - 1

//     const monday = new Date(today)
//     monday.setDate(today.getDate() - dayIndex)

//     const sunday = new Date(monday)
//     sunday.setDate(monday.getDate() + 6)
//     const sundayStr = sunday.toISOString().split('T')[0] // Будет жестко "2026-09-27"

//     // 2. ВРЕМЕННО ОТКЛЮЧАЕМ ЗАЩИТУ ОТ ПОВТОРНОГО ЗАБОРА
//     // Чтобы вы могли нажимать кнопку многократно и проверять выпадение разных призов!
//     /*
//     if (user.lastWeeklyRewardDate === sundayStr) {
//       return res.status(400).json({
//         message: 'Вы уже получили призовой сундук за эту неделю!',
//       })
//     }
//     */

//     // 3. ИСКУССТВЕННАЯ ИДЕАЛЬНАЯ НЕДЕЛЯ
//     const requiredDays = []
//     for (let i = 0; i < 7; i++) {
//       const day = new Date(monday)
//       day.setDate(monday.getDate() + i)
//       requiredDays.push(day.toISOString().split('T')[0])
//     }

//     // Вместо чтения пустой БД принудительно подсовываем массив со всеми 7 датами этой недели
//     const userCompletedDays = [...requiredDays]

//     // ==========================================
//     // НАЧАЛО БОЕВОЙ ЛОГИКИ (Остается без изменений)
//     // ==========================================

//     const hasPerfectWeek = requiredDays.every((dateStr) =>
//       userCompletedDays.includes(dateStr),
//     )

//     if (!hasPerfectWeek) {
//       return res.status(400).json({
//         message:
//           'Недостаточно выполненных тренировок. Необходимо закрыть все 7 дней недели без пропусков.',
//       })
//     }

//     // 4. ГЕНЕРАЦИЯ ПРИЗА ЧЕРЕЗ ВЫНЕСЕННУЮ УТИЛИТУ
//     const prize = await generateWeeklySuperPrize(user)

//     // 5. НАЧИСЛЕНИЕ ВЫПАВШЕЙ НАГРАДЫ В ПРОФИЛЬ ЮЗЕРА
//     if (prize.type === 'coins') {
//       user.progression.coins += prize.amount
//     } else if (prize.type === 'item') {
//       const invItem = user.inventory.find(
//         (inv) => inv.itemCode === prize.code,
//       )
//       if (invItem) {
//         invItem.quantity += 1
//       } else {
//         user.inventory.push({
//           itemCode: prize.code,
//           quantity: 1,
//           purchasedAt: new Date(),
//         })
//       }
//     } else if (prize.type === 'premium') {
//       const ONE_HOUR = 60 * 60 * 1000
//       const now = new Date()
//       const currentExpiry =
//         user.isPremium &&
//         user.premiumExpiresAt &&
//         user.premiumExpiresAt > now
//           ? user.premiumExpiresAt.getTime()
//           : now.getTime()

//       user.isPremium = true
//       user.premiumExpiresAt = new Date(currentExpiry + ONE_HOUR)
//     } else if (prize.type === 'course') {
//       user.activePurchasedCourses.push(prize.code)
//     } else if (
//       prize.type === 'achievement'

//     ) {
//       // 🎯 Корректная проверка: ищем, есть ли уже ачивка с таким кодом в массиве объектов
//       const hasAchievement = user.progression.achievements.some(
//         (ach) => ach.code === prize.code
//       )

//       if (hasAchievement) {
//         // Утешительный приз, если такое звание уже выиграно ранее
//         user.progression.coins += 500
//         // Меняем title приза, чтобы фронтенд в модалке показал компенсацию
//         prize.title = '500 жетонов оратора'
//       } else {
//         // Если звание уникальное — добавляем в профиль
//         const achievement = {
//           title: prize.title,
//           code: prize.code,
//           unlockedAt: new Date(),
//         }
//         user.progression.achievements.push(achievement)
//       }
//     } else {
//       return res
//         .status(500)
//         .json({ message: 'Сгенерирован неизвестный тип награды' })
//     }

//     // Фиксируем дату забора приза в документ юзера
//     user.lastWeeklyRewardDate = sundayStr

//     await user.save()

//     trackWeeklyPrize(user._id, prize.title)

//     return res.status(200).json({
//       success: true,
//       message: 'Вы успешно открыли призовой сундук!',
//       prize,
//       lastWeeklyRewardDate: user.lastWeeklyRewardDate,
//       coins: user.progression.coins,
//       inventory: user.inventory,
//       activePurchasedCourses: user.activePurchasedCourses,
//       achievements: user.progression.achievements,
//       isPremium: user.isPremium,
//       premiumExpiresAt: user.premiumExpiresAt,
//     })
//   } catch (error) {
//     console.error(
//       'Ошибка в контроллере claimWeeklySuperPrize:',
//       error,
//     )
//     return res
//       .status(500)
//       .json({ message: 'Внутренняя ошибка сервера' })
//   }
// }

export { getDailyTasks, claimWeeklySuperPrize }
