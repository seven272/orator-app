import AiExercise from '../models/AiExercise.js'
import { All_EXERCISES } from '../constants/exercises.js'

const checkPremiumAndTicket = (exerciseType) => {
  return async (req, res, next) => {
    try {
      // Пользователь уже извлечен из БД и лежит в req.user благодаря checkAuth middleware
      const user = req.user
      const now = new Date()

      if (!user) {
        return res
          .status(404)
          .json({ message: 'Пользователь не найден' })
      }

      // 1. ПРОВЕРКА ВАЛИДНОСТИ PREMIUM-ПОДПИСКИ (Безлимитный доступ)
      if (user.isPremium) {
        if (
          user.premiumExpiresAt &&
          now > new Date(user.premiumExpiresAt)
        ) {
          // Срок действия подписки истек — аннулируем её в базе данных
          user.isPremium = false
          user.premiumExpiresAt = null
          await user.save() // Фиксируем изменения в MongoDB

          // Не прерываем выполнение ошибкой, а спускаемся ниже к проверке билетов!
        } else {
          // Premium активен — пропускаем к тренажеру без списания билетов
          return next()
        }
      }

      // 2. ПРОВЕРКА И СПИСАНИЕ ПОШТУЧНОГО БИЛЕТА (Если Premium нет или он истек)
      // Нам больше не нужно парсить req.body. Код билета собирается строго из аргумента роутера!
      const targetTicketCode = `ticket_${exerciseType}`

      // Ищем билет с нужным кодом и остатком попыток > 0 в инвентаре пользователя
      const ticketInInventory = user.inventory.find(
        (inv) =>
          inv.itemCode === targetTicketCode && inv.quantity > 0,
      )

      // If ticket is missing or empty, deny entry
      if (!ticketInInventory) {
        return res.status(403).json({
          code: 'ACCESS_DENIED',
          message:
            'Доступ ограничен. Приобретите Premium-подписку или разовый билет в магазине!',
        })
      }

      // Если билет найден — производим декремент (списываем 1 попытку)
      ticketInInventory.quantity -= 1

      // Сохраняем обновленный документ пользователя в БД перед запуском ИИ-генерации
      await user.save()

      // Передаем управление контроллеру тренажера
      next()
    } catch (error) {
      console.error(
        `Ошибка в checkPremiumAndTicket (${exerciseType}):`,
        error,
      )
      res
        .status(500)
        .json({
          message:
            'Внутренняя ошибка сервера при проверке доступа к тренажеру',
        })
    }
  }
}

const checkActiveSessionGuard = (exerciseType) => {
  console.log('проверка активной сессии ' + exerciseType)
  return async (req, res, next) => {
    try {
      // Пользователь уже извлечен из БД благодаря checkAuth middleware
      const user = req.user
      const now = new Date()

      // 1. БЕЗЛИМИТНЫЙ ДОСТУП ДЛЯ PREMIUM
      // Если у пользователя есть действующая подписка — пропускаем мгновенно, не опрашивая коллекцию сессий
      if (
        user?.isPremium &&
        user?.premiumExpiresAt &&
        new Date(user.premiumExpiresAt) > now
      ) {
        return next()
      }

      // 2. ДИФФЕРЕНЦИРОВАННЫЙ ДОСТУП ПО БИЛЕТАМ
      // Если премиума нет, проверяем, была ли легально открыта сессия на этапе /start
      const activeSession = await AiExercise.findOne({
        userId: req.userId,
        exerciseType: exerciseType,
        status: 'active',
      }).sort({ createdAt: -1 }) // Берем самую свежую активную запись

      // Если активная сессия в базе отсутствует — пользователь пытается слать ответы в обход оплаты
      if (!activeSession) {
        return res.status(403).json({
          code: 'NO_ACTIVE_SESSION',
          message:
            'Доступ отклонен. Активная оплаченная сессия упражнения не найдена. Начните упражнение сначала.',
        })
      }

      // Привязываем найденную сессию к объекту запроса, чтобы контроллеры (например, finishPoemRap)
      // не тратили время на повторный поиск сессии в БД через .findOne()
      req.activeAiSession = activeSession

      // Всё отлично — билет списан на старте, сессия тикает, пропускаем дальше к ИИ-генерации/STT
      next()
    } catch (error) {
      console.error(
        `Ошибка в checkActiveSessionGuard (${exerciseType}):`,
        error,
      )
      res.status(500).json({
        message:
          'Внутренняя ошибка сервера при валидации сессии тренировки',
      })
    }
  }
}

const checkAndConsumeEnergy = async (req, res, next) => {
  try {
    // 1. ЕСЛИ ПОЛЬЗОВАТЕЛЬ — ГОСТЬ (isGuest === true)
    // Бэкенд пропускает его без проверок. Контроль 3 единиц и вызов VK ID One Tap происходят на фронтенде через localStorage.
    if (req.isGuest) {
      return next()
    }

    // 2. АВТОНОМНОЕ ОПРЕДЕЛЕНИЕ УРОВНЯ И СТОИМОСТИ УПРАЖНЕНИЯ
    const { exAlias } = req.body

    if (!exAlias) {
      return res.status(400).json({
        success: false,
        message: 'В теле запроса не передан идентификатор упражнения (exAlias).'
      })
    }

    // Ищем упражнение в глобальном конфигурационном объекте
    const exercise = Object.values(All_EXERCISES)
      .flat()
      .find((ex) => ex.alias === exAlias)

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Упражнение не найдено в конфигурационной константе All_EXERCISES.'
      })
    }

    // Извлекаем уровень из объекта метаданных упражнения (куда мы его внедрили)
    const exerciseLevel = exercise.level

    if (exerciseLevel !== 1 && exerciseLevel !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Мидлвар контроля энергии обрабатывает только упражнения 1 и 2 уровня.'
      })
    }

    // Расчет стоимости раунда на основе ТЗ: 1 уровень = 1 ⚡, 2 уровень = 2 ⚡
    const cost = exerciseLevel === 2 ? 2 : 1

    // Извлекаем пользователя (req.user подгружен и обновлен благодаря предыдущему optionalAuth)
    const user = req.user

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Авторизованный пользователь не найден в базе данных.' 
      })
    }

    // 3. БЕЗЛИМИТНЫЙ ДОСТУП ДЛЯ PREMIUM
    // Если подписка активна — лимиты энергии полностью игнорируются, сразу пропускаем
    const now = new Date()
    if (user.isPremium) {
      if (user.premiumExpiresAt && now > new Date(user.premiumExpiresAt)) {
        // Подписка закончилась прямо во время сессии — лениво сбрасываем флаги в СУБД,
        // но НЕ блокируем юзера, а спускаем его ниже к проверке его накопленной суточной энергии
        user.isPremium = false
        user.premiumExpiresAt = null
        await user.save()
      } else {
        return next()
      }
    }

    // 4. ЛЕНИВЫЙ СБРОС СУТОЧНОЙ ДАТЫ (Формат строки: YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0] // Отрезаем время, оставляя только дату

    if (user.dailyEnergy.lastAttemptDate !== todayStr) {
      user.dailyEnergy.used = 0
      user.dailyEnergy.lastAttemptDate = todayStr
    }

    // 5. ПРОВЕРКА ОСТАТКА ЭНЕРГИИ И СПИСАНИЕ
    const freeEnergy = user.dailyEnergy.allowed - user.dailyEnergy.used

    if (freeEnergy >= cost) {
      // Энергии в баке достаточно — списываем стоимость раунда
      user.dailyEnergy.used += cost
      await user.save() // Фиксируем изменения в MongoDB
      
      return next() // Пропускаем запрос дальше в контроллер completeExercise
    }

    // 6. БЛОКИРОВКА С ОТПРАВКОЙ ОСОБОГО МАРКЕРА ОШИБКИ ДЛЯ AXIOS INTERCEPTOR
    // Возвращаем 403 статус, но с кодом 'ENERGY_EXHAUSTED', чтобы фронтенд перехватил его в обход редиректа
    return res.status(403).json({
      success: false,
      code: 'ENERGY_EXHAUSTED',
      message: 'Суточный лимит бесплатной энергии исчерпан. Для продолжения тренировок оформите Premium-подписку!',
      dailyEnergy: {
        allowed: user.dailyEnergy.allowed,
        used: user.dailyEnergy.used
      }
    })

  } catch (error) {
    console.error('Ошибка в мидлваре checkAndConsumeEnergy:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера при проверке игровых лимитов энергии.' 
    })
  }
}


export { checkPremiumAndTicket, checkActiveSessionGuard, checkAndConsumeEnergy }
