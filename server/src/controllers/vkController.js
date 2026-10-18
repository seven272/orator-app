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

    // АТОМАРНОЕ НАЧИСЛЕНИЕ РЕСУРСОВ
    // Овердрафт: уводим `dailyEnergy.used` в минус (например, 0 - 5 = -5 потраченной энергии)
    //  ФОРМИРОВАНИЕ ЗАПРОСА В ЗАВИСИМОСТИ ОТ ТИПА ЗАДАНИЯ
    let updateQuery = {}

    if (taskType === 'favorites') {
      // Для Избранного СОГЛАСНО ПУНКТУ 2.6.2 ПРАВИЛ ВК — ТОЛЬКО фиксация выполнения, БЕЗ НАГРАД
      updateQuery = {
        $set: {
          [`socialProfilesData.vk.viralBonusesClaimed.${taskType}`]: true,
        },
      }
    } else {
      // Для всех остальных тасков — начисляем комбо-награды в полном объёме
      // СИНХРОНИЗАЦИЯ ДАТЫ ЛЕНИВОГО СБРОСА ЭНЕРГИИ
      // Получаем текущую дату сервера в формате YYYY-MM-DD (например, "2026-09-21")
      const currentServerDate = new Date().toISOString().split('T')[0]

      // Если наступил новый день, а ленивый сброс в тренажерах еще не срабатывал
      if (user.dailyEnergy?.lastAttemptDate !== currentServerDate) {
        // Сразу фиксируем сброс в документе пользователя перед начислением бонуса
        user.dailyEnergy.used = 0
        user.dailyEnergy.lastAttemptDate = currentServerDate
        await user.save()
      }

      updateQuery = {
        $set: {
          [`socialProfilesData.vk.viralBonusesClaimed.${taskType}`]: true,
        },
        $inc: {
          'progression.xp': 100,
          'stats.lifetimeXp': 100,
          'progression.coins': 10,
          'dailyEnergy.used': -5,
        },
      }
    }

    // Сохраняем изменения и извлекаем обновленный документ
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateQuery,
      { new: true, runValidators: true },
    )
    return res.status(200).json({
      message:
        taskType === 'favorites'
          ? 'Приложение успешно закреплено!'
          : 'Награда успешно начислена!',
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
