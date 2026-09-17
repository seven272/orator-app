import ShopItem from '../models/ShopItem.js'
import User from '../models/User.js'

import { trackShopPurchase } from '../utils/feedService.js'
import { checkAchievements } from '../utils/achievementService.js'

// 1. Получить все товары
const getShopItems = async (req, res) => {
  try {
    const items = await ShopItem.find({})
    res.status(200).json(items)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ошибка при получении товаров' })
  }
}

// 2. Купить товар
const buyItem = async (req, res) => {
  try {
    const { itemCode, deliveryAddress } = req.body
    const userId = req.userId

    const [item, user] = await Promise.all([
      ShopItem.findOne({ code: itemCode }),
      User.findById(userId),
    ])

    if (!item)
      return res.status(404).json({ message: 'Товар не найден' })
    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    // Проверяем баланс жетонов оратора
    if (user.progression.coins < item.price) {
      return res
        .status(400)
        .json({ message: 'Недостаточно жетонов оратора' })
    }

    // Проверяем, есть ли уже этот предмет в инвентаре
    const hasItem = user.inventory.some(
      (inv) => inv.itemCode === itemCode,
    )

    // Блокируем повторную покупку, только если вещь уникальная
    // (Не утилита И не физический мерч)
    if (
      hasItem &&
      item.category !== 'utility' &&
      item.category !== 'merch'
    ) {
      return res
        .status(400)
        .json({ message: 'Вы уже приобрели этот товар' })
    }

    // 🕒 КЕЙС: Покупка Premium-статуса на 1 час
    if (itemCode === 'premium_1h') {
      const now = new Date()

      // Если у пользователя уже активен ЛЮБОЙ Premium (месячный или часовой), блокируем покупку
      if (
        user.isPremium &&
        user.premiumExpiresAt &&
        user.premiumExpiresAt > now
      ) {
        return res.status(400).json({
          message:
            'У вас уже активирован Premium-статус! Дождитесь окончания его действия.',
        })
      }

      // Если премиума нет или прошлый уже истек — включаем строго на 1 час от текущего момента
      const ONE_HOUR = 60 * 60 * 1000
      user.isPremium = true
      user.premiumExpiresAt = new Date(now.getTime() + ONE_HOUR)
    }

    // Списываем монеты за покупку
    user.progression.coins -= item.price

    // 📦 НАЧИСЛЕНИЕ В ИНВЕНТАРЬ / ОБРАБОТКА КАТЕГОРИЙ

    // 1. Если это утилита (расходник, включая билеты на тренажеры и заморозку) и она уже есть
    if (item.category === 'utility' && hasItem) {
      const invItem = user.inventory.find(
        (inv) => inv.itemCode === itemCode,
      )
      invItem.quantity += 1
    }
    // 2. Если это физический мерч — ВСЕГДА создаем новую запись заказа
    else if (item.category === 'merch') {
      user.inventory.push({
        itemCode: item.code,
        quantity: 1,
        purchasedAt: new Date(),
        deliveryAddress: deliveryAddress || '',
        isShipped: false,
      })
    }
    // 3. Для всех остальных новых или уникальных виртуальных товаров (темы, ачивки, или первая покупка утилиты)
    else {
      user.inventory.push({
        itemCode: item.code,
        quantity: 1,
        purchasedAt: new Date(),
      })
    }

    // Вызываем утилиту. Она проверит свежий инвентарь и вернет массив новых ачивок
    const newAwards = checkAchievements(user, false, 0, '')

    // Логика титулов и достижений (для "thought_guru" и нового "title_neon")
    if (item.category === 'achievement') {
      user.progression.achievements.push({
        title: item.title,
        code: item.code,
        unlockedAt: new Date(),
      })
    }

    await user.save()

    // Триггер фонового сервиса для автоматической публикации в "Пульс сообщества"
    trackShopPurchase(user._id, item.title)

    // Возвращаем понятный ответ фронтенду
    res.status(200).json({
      message:
        item.category === 'merch'
          ? 'Заказ успешно оформлен!'
          : 'Покупка совершена успешно!',
      coins: user.progression.coins,
      inventory: user.inventory,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      newAchievements: newAwards || [],
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при покупке' })
  }
}

export { getShopItems, buyItem }
