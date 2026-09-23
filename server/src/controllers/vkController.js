import User from '../models/User.js'

// Список валидных типов заданий, поступающих от фронтенда
const VALID_TASKS = [
  'favorites',
  'homeScreen',
  'notifications',
  'communityJoin',
]

/**
 * Эндпоинт начисления наград за выполнение виральных квестов в ВК
 * POST /api/vk-features/claim-bonus
 */
const claimVkBonus = async (req, res) => {
  try {
    const { taskType } = req.body
    //нативный vkId, прописанный мидлваром подписи
    const vkId = req.vkId
    console.log('тип фичи ВК ' + taskType)
    //  Проверка входящих данных
    if (!VALID_TASKS.includes(taskType)) {
      return res
        .status(400)
        .json({ message: 'Некорректный тип вирального задания' })
    }

    if (!vkId) {
      return res
        .status(401)
        .json({ message: 'Пользователь ВК не идентифицирован' })
    }

    // Ищем пользователя в СУБД по vkId
    const user = await User.findOne({ vkId })
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь Govorix не найден' })
    }
    // Проверяем, не был ли бонус получен ранее
    const isAlreadyClaimed =
      user.socialProfilesData?.vk?.viralBonusesClaimed?.[taskType]
    if (isAlreadyClaimed) {
      return res.status(400).json({
        message:
          'Вы уже получили награду за выполнение этого задания',
      })
    }

    // 4. СИНХРОНИЗАЦИЯ ДАТЫ ЛЕНИВОГО СБРОСА ЭНЕРГИИ
    // Получаем текущую дату сервера в формате YYYY-MM-DD (например, "2026-09-21")
    const currentServerDate = new Date().toISOString().split('T')[0]

    // Если наступил новый день, а ленивый сброс в тренажерах еще не срабатывал
    if (user.dailyEnergy?.lastAttemptDate !== currentServerDate) {
      // Сразу фиксируем сброс в документе пользователя перед начислением бонуса
      user.dailyEnergy.used = 0
      user.dailyEnergy.lastAttemptDate = currentServerDate
      await user.save()
    }

    // АТОМАРНОЕ НАЧИСЛЕНИЕ РЕСУРСОВ
    // Овердрафт: уводим `dailyEnergy.used` в минус (например, 0 - 5 = -5 потраченной энергии)
    const updateQuery = {
      $set: {
        [`socialProfilesData.vk.viralBonusesClaimed.${taskType}`]: true,
      },
      $inc: {
        'progression.xp': 100, // +100 Опыта к текущему уровню
        'stats.lifetimeXp': 100, // +100 к глобальному счетчику для топ-10 рейтингов
        'progression.coins': 10, // +10 Жетонов оратора в кошелек
        'dailyEnergy.used': -5, // Овердрафт бака на 5 единиц через минус
      },
    }

    // Сохраняем изменения и извлекаем обновленный документ
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateQuery,
      { new: true, runValidators: true },
    )
    console.log(updatedUser)
    return res.status(200).json({
      message: 'Награда успешно начислена!',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Ошибка в контроллере claimVkBonus:', error)
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера при начислении бонуса',
    })
  }
}

export { claimVkBonus }
