// controllers/leaderboardController.js
import User from '../models/User.js'

const getLeaderboard = async (req, res) => {
  try {
    // В зависимости от вашей реализации авторизации, извлеките ID, если токен есть.
    // Если токена нет, то currentUserId будет undefined.
    const currentUserId = req.userId // Мидлвар optionalAuth запишет его сюда, если юзер вошел

    const { type } = req.query // 'global' или 'weekly'
    const isWeekly = type === 'weekly'

    // 1. Формируем правила сортировки
    const sortQuery = isWeekly
      ? { weeklyXp: -1 }
      : { 'stats.lifetimeXp': -1 }

    // 2. Получаем ТОП-10 пользователей (доступно всем)
    const topUsers = await User.find({})
      .sort(sortQuery)
      .limit(10)
      .select(
        'displayName progression.level stats.lifetimeXp weeklyXp isPremium avatar',
      )

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      displayName: user.displayName || 'Аноним',
      level: user.progression?.level || 1,
      score: isWeekly ? user.weeklyXp : user.stats.lifetimeXp,
      isPremium: user.isPremium,
      avatar: user.avatar,
    }))

    // 3. Рассчитываем ранг ТОЛЬКО если пользователь авторизован
    let currentUserData = null

    if (currentUserId) {
      const currentUser = await User.findById(currentUserId)

      // Если токен прилетел, но юзера стерли из базы
      if (currentUser) {
        let higherUsersCount = 0

        if (isWeekly) {
          higherUsersCount = await User.countDocuments({
            weeklyXp: { $gt: currentUser.weeklyXp },
          })
        } else {
          higherUsersCount = await User.countDocuments({
            'stats.lifetimeXp': { $gt: currentUser.stats.lifetimeXp },
          })
        }

        currentUserData = {
          rank: higherUsersCount + 1,
          id: currentUser._id,
          displayName: currentUser.displayName || 'Вы',
          level: currentUser.progression?.level || 1,
          score: isWeekly
            ? currentUser.weeklyXp
            : currentUser.stats.lifetimeXp,
          isPremium: currentUser.isPremium,
          avatar: currentUser.avatar,
        }
      }
    }

    // Отправляем успешный ответ: для гостей currentUser будет равен null, но leaderboard загрузится!
    res.status(200).json({
      leaderboard,
      currentUser: currentUserData,
    })
  } catch (error) {
    console.error('Ошибка в getLeaderboard:', error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при загрузке рейтинга' })
  }
}

export { getLeaderboard }
