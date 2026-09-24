import User from '../models/User.js'
import DailyTask from '../models/DailyTask.js'
import Task from '../models/Task.js'
// import { generateWeeklySuperPrize } from '../utils/prizeGenerator.js'

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
        locked: task.premium && !user.isPremium,
        currentValue: userProgress ? userProgress.currentValue : 0,
        isCompleted: userProgress ? userProgress.isCompleted : false,
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

//     // 1. Вычисляем даты текущей недели
//     const today = new Date()
//     const currentDay = today.getDay()
//     const dayIndex = currentDay === 0 ? 6 : currentDay - 1

//     const monday = new Date(today)
//     monday.setDate(today.getDate() - dayIndex)

//     const sunday = new Date(monday)
//     sunday.setDate(monday.getDate() + 6)
//     const sundayStr = sunday.toISOString().split('T')[0]

//     // 2. ЗАЩИТА: Проверяем, не забирал ли уже награду на этой неделе
//     if (user.lastWeeklyRewardDate === sundayStr) {
//       return res
//         .status(400)
//         .json({
//           message: 'Вы уже получили призовой сундук за эту неделю!',
//         })
//     }

//     // 3. ПРОВЕРКА ДИСЦИПЛИНЫ
//     const requiredDays = []
//     for (let i = 0; i < 7; i++) {
//       const day = new Date(monday)
//       day.setDate(monday.getDate() + i)
//       requiredDays.push(day.toISOString().split('T')[0])
//     }

//     const userCompletedDays = [
//       ...new Set(
//         user.dailyProgress
//           .filter((item) => item.isCompleted === true)
//           .map((item) => item.date),
//       ),
//     ]

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
//     switch (prize.type) {
//       case 'coins':
//         user.progression.coins += prize.amount
//         break

//       case 'item':
//         // Добавление купона ИИ в инвентарь
//         const invItem = user.inventory.find(
//           (inv) => inv.itemCode === prize.code,
//         )
//         if (invItem) {
//           invItem.quantity += 1
//         } else {
//           user.inventory.push({
//             itemCode: prize.code,
//             quantity: 1,
//             purchasedAt: new Date(),
//           })
//         }
//         break

//       case 'premium':
//         // Начисление 1 часа Premium
//         const ONE_HOUR = 60 * 60 * 1000
//         const now = new Date()
//         const currentExpiry =
//           user.isPremium &&
//           user.premiumExpiresAt &&
//           user.premiumExpiresAt > now
//             ? user.premiumExpiresAt.getTime()
//             : now.getTime()

//         user.isPremium = true
//         user.premiumExpiresAt = new Date(currentExpiry + ONE_HOUR)
//         break

//       case 'course':
//         // Начисление выигранного курса
//         user.activePurchasedCourses.push(prize.code)
//         break

//       default:
//         return res
//           .status(500)
//           .json({ message: 'Сгенерирован неизвестный тип награды' })
//     }

//     // Фиксируем дату забора приза для предотвращения абуза
//     user.lastWeeklyRewardDate = sundayStr

//     await user.save()

//     return res.status(200).json({
//       success: true,
//       message: 'Вы успешно открыли призовой сундук!',
//       prize,
//       lastWeeklyRewardDate: user.lastWeeklyRewardDate,
//       coins: user.progression.coins,
//       inventory: user.inventory,
//       activePurchasedCourses: user.activePurchasedCourses,
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

const claimWeeklySuperPrize = async (req, res) => {
  try {
    const userId = req.userId
    const user = await User.findById(userId)

    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    // 🎯 ХАРДКОД ДЛЯ ТЕСТИРОВАНИЯ: Игнорируем проверки и принудительно генерируем приз
    const sundayStr = '2026-09-27' // Подставляем дату ближайшего воскресенья сентября 2026 года

    /* 
       Закомментируем временно проверку на повторный забор, 
       чтобы вы могли нажимать кнопку сколько угодно раз и смотреть разные призы!
       
    if (user.lastWeeklyRewardDate === sundayStr) {
      return res.status(400).json({ message: 'Вы уже получили призовой сундук за эту неделю!' })
    }
    */

    // Искусственно выбираем ветку призов (можете менять число вручную, чтобы протестировать все)
    // roll < 35 (монеты 500), roll < 65 (билеты), roll < 85 (1000 монет / премиум), roll >= 85 (курс)
    const roll = Math.random() * 100
    let prize = null

    if (roll < 35) {
      prize = {
        type: 'coins',
        amount: 500,
        title: '500 жетонов оратора',
      }
      user.progression.coins += prize.amount
    } else if (roll < 65) {
      prize = {
        type: 'item',
        code: 'ticket_ai-bargain',
        title: 'Купон: «Торг уместен»',
      }
      // Логика добавления билета
      const invItem = user.inventory.find(
        (inv) => inv.itemCode === prize.code,
      )
      if (invItem) invItem.quantity += 1
      else
        user.inventory.push({
          itemCode: prize.code,
          quantity: 1,
          purchasedAt: new Date(),
        })
    } else if (roll < 85) {
      if (Math.random() > 0.5) {
        prize = {
          type: 'coins',
          amount: 1000,
          title: '1 000 жетонов оратора',
        }
        user.progression.coins += prize.amount
      } else {
        prize = { type: 'premium', title: 'Premium статус (1 час)' }
        user.isPremium = true
        user.premiumExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
      }
    } else {
      // Искусственно дарим курс «Жесткие переговоры»
      prize = {
        type: 'course',
        code: 'course_negotiations',
        title: 'Обучающий курс «Жесткие переговоры»',
      }
      if (!user.activePurchasedCourses.includes(prize.code)) {
        user.activePurchasedCourses.push(prize.code)
      }
    }

    // Сохраняем изменения в базе, чтобы баланс монет или инвентарь реально росли
    await user.save()

    // Возвращаем успешный ответ, как будто всё честно выполнено
    return res.status(200).json({
      success: true,
      message: 'Вы успешно открыли призовой сундук!',
      prize,
      lastWeeklyRewardDate: sundayStr,
      coins: user.progression.coins,
      inventory: user.inventory,
      activePurchasedCourses: user.activePurchasedCourses,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export { getDailyTasks, claimWeeklySuperPrize }
