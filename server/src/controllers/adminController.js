import User from '../models/User.js'
import UserCourseProgress from '../models/UserCourseProgress.js'

const getStatistics = async (req, res) => {
  try {
    // 1. Общее количество пользователей в приложении
    const total_users = await User.countDocuments()

    // ПОДСЧЕТ ПРЕМИУМ-ПОЛЬЗОВАТЕЛЕЙ
    // Считаем документы, у которых флаг isPremium равен true
    const premium_users_count = await User.countDocuments({
      isPremium: true,
    })

    // Рассчитываем процент конверсии в премиум (защищаем от деления на ноль, если база пустая)
    const premium_percentage =
      total_users > 0
        ? ((premium_users_count / total_users) * 100).toFixed(1) // Округляем до 1 знака после запятой
        : 0

    // 2. Глобальная экономика и прогресс
    // Корректируем пути с учетом вложенности в объект progression
    const global_stats = await User.aggregate([
      {
        $group: {
          _id: null,
          // Считаем среднее, обращаясь через точку к progression
          avg_level: { $avg: '$progression.level' },
          total_coins: { $sum: '$progression.coins' },
          avg_lifetime_xp: { $avg: '$stats.lifetimeXp' },
        },
      },
    ])

    // Вытаскиваем значения из массива агрегации (если база пустая, ставим дефолты)
    const stats_result = global_stats[0] || {
      avg_level: 1,
      total_coins: 0,
      avg_lifetime_xp: 0,
    }

    // 3. Удержание (стрики)
    const active_streaks = await User.countDocuments({
      'streak.current': { $gt: 0 },
    })

    // 4. Активность по дням на основе dailyProgress
    const exercises_analytics = await User.aggregate([
      // Разворачиваем массив dailyProgress, встроенный в схему пользователя
      { $unwind: '$dailyProgress' },
      // Группируем по текстовой дате "YYYY-MM-DD"
      {
        $group: {
          _id: '$dailyProgress.date',
          // Считаем количество выполненных задач (сессий) за этот день
          total_sessions: { $sum: '$dailyProgress.currentValue' },
          // Добавляем расчет среднего балла за день
          avg_score: { $avg: '$dailyProgress.currentValue' },
        },
      },
      // Убираем пустые или кривые даты, если они проскочат
      { $match: { _id: { $ne: null } } },
      // Сортируем от новых к старым
      { $sort: { _id: -1 } },
      // Ограничиваем вывод последней неделей активности
      { $limit: 7 },
    ])

    // 5. РЕАЛЬНЫЕ ПОКУПКИ (Агрегация из массива inventory каждого юзера)
    const top_purchases = await User.aggregate([
      // Разворачиваем массив покупок inventory
      { $unwind: '$inventory' },
      // Группируем по коду купленного товара
      {
        $group: {
          _id: '$inventory.itemCode',
          // Суммируем количество купленных единиц товара
          purchase_count: { $sum: '$inventory.quantity' },
        },
      },
      // Сортируем по популярности (где больше всего покупок)
      { $sort: { purchase_count: -1 } },
      // Берем топ-5 самых покупаемых предметов в приложении
      { $limit: 5 },
    ])

    // Форматируем вывод покупок для фронтенда
    const formatted_purchases = top_purchases.map((item) => ({
      item_name: item._id, // Код предмета (например, "streak_freeze")
      purchase_count: item.purchase_count,
    }))

    // А) Глобальная сводка по всем курсам приложения
    const global_courses_aggregation =
      await UserCourseProgress.aggregate([
        {
          $group: {
            _id: null,
            total_purchased: { $sum: 1 }, // Общее количество начатых/купленных курсов
            total_completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            total_failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
          },
        },
      ])

    const courses_summary = global_courses_aggregation[0] || {
      total_purchased: 0,
      total_completed: 0,
      total_failed: 0,
    }

    // Б) Покурсовая детализация (группировка по courseCode)
    const courses_items_analytics =
      await UserCourseProgress.aggregate([
        {
          $group: {
            _id: '$courseCode',
            purchased: { $sum: 1 }, // Сколько раз курс был открыт
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
          },
        },
        { $sort: { purchased: -1 } }, // Сортируем от самых популярных курсов к менее популярным
      ])

    // Форматируем вывод по каждому курсу для фронтенда
    const formatted_courses_items = courses_items_analytics.map(
      (item) => ({
        courseCode: item._id,
        purchased: item.purchased,
        completed: item.completed,
        failed: item.failed,
      }),
    )

    // 6. Отправка ответа на фронтенд
    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_users,
          active_streaks,
          premium_users_count, // Передаем количество премиумов
          premium_percentage,
          avg_level: Math.round(stats_result.avg_level),
          total_coins_in_economy: stats_result.total_coins,
          avg_xp: Math.round(stats_result.avg_lifetime_xp),
        },
        exercises_analytics,
        top_purchases: formatted_purchases,
        courses_analytics: {
          summary: courses_summary,
          items: formatted_courses_items,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сборе аналитики',
      error: error.message,
    })
  }
}

const getUserList = async (req, res) => {
  try {
    const limit = 10 // Строго по 10 пользователей на страницу
    const page = parseInt(req.query.page) || 1
    const search = req.query.search || ''

    // Формируем динамический фильтр для поиска
    let query_filter = {}
    if (search) {
      // Проверяем, является ли поисковый запрос валидным ObjectId MongoDB
      const is_object_id = search.match(/^[0-9a-fA-F]{24}$/)

      if (is_object_id) {
        // Если ввели точный ID — ищем строго по нему
        query_filter = { _id: search }
      } else {
        // Иначе ищем по displayName (регистронезависимо через регулярное выражение)
        query_filter = {
          displayName: { $regex: search, $options: 'i' },
        }
      }
    }

    // Считаем общее количество найденных документов для правильного рассчета страниц
    const total_found_users = await User.countDocuments(query_filter)
    const total_pages = Math.ceil(total_found_users / limit)

    // Достаем нужную порцию данных
    const users = await User.find(
      query_filter,
      'displayName email progression.level progression.coins isPremium stats.lifetimeXp',
    )
      .sort({ 'stats.lifetimeXp': -1 }) // Лидерборд-сортировка
      .skip((page - 1) * limit) // Пропускаем пользователей предыдущих страниц
      .limit(limit) // Ограничиваем выдачу

    res.status(200).json({
      success: true,
      users,
      total_pages,
      current_page: page,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка пользователей',
    })
  }
}

const togglePremiumUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден' })
    }

    // Инвертируем текущее состояние премиума
    user.isPremium = !user.isPremium
    await user.save()

    res.status(200).json({
      success: true,
      message: `Премиум статус изменен на ${user.isPremium}`,
      isPremium: user.isPremium,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Ошибка при изменении статуса',
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const deleted_user = await User.findByIdAndDelete(req.params.id)
    if (!deleted_user) {
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден' })
    }
    res.status(200).json({
      success: true,
      message: 'Пользователь успешно удален из системы',
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Не удалось удалить пользователя',
    })
  }
}

const getMerchOrders = async (req, res) => {
  try {
    // Ищем всех пользователей, у которых в инвентаре есть коды с префиксом merch_
    const usersWithMerch = await User.find(
      { 'inventory.itemCode': { $regex: /^merch_/ } },
      'displayName email inventory',
    )

    const orders = []

    // Формируем плоский список заказов для удобного вывода на фронтенде
    usersWithMerch.forEach((user) => {
      user.inventory.forEach((item) => {
        if (item.itemCode.startsWith('merch_')) {
          orders.push({
            order_id: item._id, // Используем нативный ID подобъекта MongoDB
            user_id: user._id,
            user_name: user.displayName || 'Без имени',
            user_email: user.email || 'Вход через соцсети',
            item_code: item.itemCode,
            quantity: item.quantity,
            delivery_address:
              item.deliveryAddress || 'Адрес не указан',
            is_shipped: item.isShipped || false,
            purchased_at: item.purchasedAt,
          })
        }
      })
    })

    // Сортируем заказы по дате покупки (сначала самые свежие)
    orders.sort(
      (a, b) => new Date(b.purchased_at) - new Date(a.purchased_at),
    )

    res.status(200).json({ success: true, orders })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов мерча',
    })
  }
}

const toggleStatusMerch = async (req, res) => {
  try {
    // Ищем пользователя, у которого в массиве инвентаря лежит этот конкретный orderId
    const user = await User.findOne({
      'inventory._id': req.params.orderId,
    })
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Заказ не найден' })

    // Находим этот заказ в массиве и инвертируем флаг
    const order = user.inventory.id(req.params.orderId)
    order.isShipped = !order.isShipped

    await user.save()
    res
      .status(200)
      .json({ success: true, is_shipped: order.isShipped })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: 'Ошибка сервера' })
  }
}

export {
  getStatistics,
  getUserList,
  togglePremiumUser,
  deleteUser,
  getMerchOrders,
  toggleStatusMerch,
}
