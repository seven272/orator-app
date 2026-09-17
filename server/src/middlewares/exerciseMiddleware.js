import AiExercise from '../models/AiExercise.js'
import User from '../models/User.js'
import createToken from '../utils/createToken.js'

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
        if (user.premiumExpiresAt && now > new Date(user.premiumExpiresAt)) {
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
        (inv) => inv.itemCode === targetTicketCode && inv.quantity > 0
      )

      // If ticket is missing or empty, deny entry
      if (!ticketInInventory) {
        return res.status(403).json({
          code: 'ACCESS_DENIED',
          message: 'Доступ ограничен. Приобретите Premium-подписку или разовый билет в магазине!',
        })
      }

      // Если билет найден — производим декремент (списываем 1 попытку)
      ticketInInventory.quantity -= 1

      // Сохраняем обновленный документ пользователя в БД перед запуском ИИ-генерации
      await user.save()

      // Передаем управление контроллеру тренажера
      next()

    } catch (error) {
      console.error(`Ошибка в checkPremiumAndTicket (${exerciseType}):`, error)
      res.status(500).json({ message: 'Внутренняя ошибка сервера при проверке доступа к тренажеру' })
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

export { checkPremiumAndTicket, checkActiveSessionGuard }
