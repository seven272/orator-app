import User from '../models/User.js'

const getLeaderboard = async (req, res) => {
  try {
    const currentUserId = req.userId
    const { type } = req.query // 'global' или 'weekly'

    const isWeekly = type === 'weekly'

    // 1. Формируем правила сортировки
    // Глобальный рейтинг строим по lifetimeXp, недельный — по weeklyXp
    const sortQuery = isWeekly
      ? { weeklyXp: -1 }
      : { 'stats.lifetimeXp': -1 }

    // 2. Получаем ТОП-10 пользователей
    const topUsers = await User.find({})
      .sort(sortQuery)
      .limit(10)
      .select(
        'displayName progression.level stats.lifetimeXp weeklyXp isPremium avatar',
      )

    // Маппим массив под единый формат для фронтенда
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user._id, 
      displayName: user.displayName || 'Аноним',
      level: user.progression.level,
      score: isWeekly ? user.weeklyXp : user.stats.lifetimeXp, // Отдаем нужные очки
      isPremium: user.isPremium,
      avatar: user.avatar,
    }))

    // 3. Рассчитываем ранг и данные для текущего пользователя
    const currentUser = await User.findById(currentUserId)
    if (!currentUser) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    let higherUsersCount = 0

    // Считаем, сколько людей имеют счет строго больше, чем у текущего пользователя
    if (isWeekly) {
      higherUsersCount = await User.countDocuments({
        weeklyXp: { $gt: currentUser.weeklyXp },
      })
    } else {
      higherUsersCount = await User.countDocuments({
        'stats.lifetimeXp': { $gt: currentUser.stats.lifetimeXp },
      })
    }

    res.status(200).json({
      leaderboard,
      currentUser: {
        rank: higherUsersCount + 1, // Его реальное место (количество людей выше + 1)
        id: currentUser._id,
        displayName: currentUser.displayName || 'Вы',
        level: currentUser.progression.level,
        score: isWeekly
          ? currentUser.weeklyXp
          : currentUser.stats.lifetimeXp,
        isPremium: currentUser.isPremium,
        avatar: currentUser.avatar,
      },
    })
  } catch (error) {
    console.error('Ошибка в getLeaderboard:', error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при загрузке рейтинга' })
  }
}

export { getLeaderboard }
