import LiveDuel from '../models/LiveDuel.js'
import User from '../models/User.js'

const checkDuelLimits = async (req, res, next) => {
  try {
    const userId = req.userId

    // 1. Проверяем премиум-статус пользователя
    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден.' })
    }

    // Ораторы с Premium статусом имеют неограниченное число поединков
    if (user.isPremium) {
      return next()
    }

    // 2. Вычисляем временную метку начала сегодняшнего дня (00:00:00 UTC)
    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)

    // 3. Считаем количество баттлов пользователя за сегодня
    // Учитываем комнаты, где он был Создателем (userA) или Оппонентом (userB)
    // и которые дошли до игры или финала (active, completed), либо находятся в ожидании (pending)
    const todaysDuelsCount = await LiveDuel.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
      status: { $in: ['active', 'completed', 'pending'] },
      createdAt: { $gte: startOfToday },
    })

    // 4. Проверяем тематический лимит: максимум 3 поединка в сутки
    const MAX_DAILY_ATTEMPTS = 3
    if (todaysDuelsCount >= MAX_DAILY_ATTEMPTS) {
      return res.status(403).json({
        success: false,
        isLimitReached: true, // Сигнал фронтенду для открытия окна покупки Premium
        message: `Вы исчерпали суточный лимит бесплатных поединков (${todaysDuelsCount}/${MAX_DAILY_ATTEMPTS}). Оформите Premium для безлимитных баттлов!`,
      })
    }

    // Если лимит не превышен — спокойно пропускаем в контроллер
    next()
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message })
  }
}

export { checkDuelLimits }
