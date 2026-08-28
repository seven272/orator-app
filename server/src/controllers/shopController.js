import ShopItem from '../models/ShopItem.js'
import User from '../models/User.js'

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

    // Проверяем баланс жетонов
    if (user.progression.coins < item.price) {
      return res
        .status(400)
        .json({ message: 'Недостаточно жетонов оратора' })
    }

    // Проверяем, есть ли уже этот предмет в инвентаре
    const hasItem = user.inventory.some(
      (inv) => inv.itemCode === itemCode,
    )

    // ИСПРАВЛЕНИЕ: Блокируем покупку, только если вещь уникальная
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

    // Списываем монеты
    user.progression.coins -= item.price

    // 1. Если это утилита (расходник) и она уже есть — просто увеличиваем её количество
    if (item.category === 'utility' && hasItem) {
      const invItem = user.inventory.find(
        (inv) => inv.itemCode === itemCode,
      )
      invItem.quantity += 1
    }
    // 2. ИСПРАВЛЕНИЕ: Если это физический мерч — ВСЕГДА создаем новую запись заказа,
    // даже если такой мерч уже покупался ранее (hasItem здесь игнорируем)
    else if (item.category === 'merch') {
      user.inventory.push({
        itemCode: item.code,
        quantity: 1,
        purchasedAt: new Date(),
        deliveryAddress: deliveryAddress || '', // Сохраняем адрес
        isShipped: false,
      })
    }
    // 3. Для всех остальных уникальных виртуальных товаров (темы, ачивки),
    // которые покупаются СТРОГО один раз за всю историю аккаунта
    else {
      user.inventory.push({
        itemCode: item.code,
        quantity: 1,
        purchasedAt: new Date(),
        // поля deliveryAddress и isShipped здесь не нужны, mongoose оставит их дефолтными
      })
    }

    // Логика титулов (остается без изменений)
    if (item.category === 'achievement') {
      user.progression.achievements.push({
        title: item.title,
        code: item.code,
        unlockedAt: new Date(),
      })
    }

    await user.save()

    // Возвращаем понятный ответ фронтенду
    res.status(200).json({
      message:
        item.category === 'merch'
          ? 'Заказ успешно оформлен!'
          : 'Покупка совершена!',
      coins: user.progression.coins,
      inventory: user.inventory,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при покупке' })
  }
}

export { getShopItems, buyItem }
