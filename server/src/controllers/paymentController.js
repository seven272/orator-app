import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import Order from '../models/Order.js'
import User from '../models/User.js'
import {
  PREMIUM_PRODUCTS,
  COURSE_PRODUCTS, 
} from '../constants/paymentProducts.js'

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments'

// Создание платежа ЮKassa (Универсальный)
const createPaymentYookassa = async (req, res) => {
  try {
    const userId = req.userId // Извлечено из checkAuth
    const { typeOrder, itemCode, isVk } = req.body // typeOrder: 'premium_subscription' или 'course_purchase'
    // Динамически определяем, куда вернуть пользователя после успешного шлюза ЮKassa

    let product = null
    let description = ''

    const targetPage = typeOrder === 'premium_subscription' ? 'profile' : 'courses'

    const returnUrl = isVk
      ? `https://vk.ru/app54762318/#/${targetPage}`
      : `https://govorix.ru/#/${targetPage}`

    // 1. Валидация продукта и формирование описания
    if (typeOrder === 'premium_subscription') {
      product = PREMIUM_PRODUCTS[itemCode]
      if (!product)
        return res
          .status(400)
          .json({ message: 'Неверный код подписки' })
      description = `Оплата ${product.title} в Govorix`
    } else if (typeOrder === 'course_purchase') {
      product = COURSE_PRODUCTS[itemCode]
      if (!product)
        return res
          .status(400)
          .json({ message: 'Неверный код интенсива' })

      // Дополнительная проверка: куплен ли уже курс
      if (req.user.activePurchasedCourses.includes(itemCode)) {
        return res
          .status(400)
          .json({ message: 'Этот интенсив вами уже приобретен' })
      }

      description = `Оплата курса "${product.title}" в Govorix`
    } else {
      return res.status(400).json({ message: 'Неверный тип заказа' })
    }

    const idempotenceKey = uuidv4()
    const shopId = String(process.env.YOOKASSA_SHOP_ID).trim()
    const secretKey = String(process.env.YOOKASSA_SECRET_KEY).trim()

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString(
      'base64',
    )

    // 2. Создаем запись о заказе в БД со статусом "created"
    const order = await Order.create({
      orderId: idempotenceKey,
      userId,
      typeOrder,
      itemCode,
      paymentMethod: 'yookassa',
      amount: parseFloat(product.price),
      status: 'created',
    })

    // 3. Запрос к API ЮKassa
    const response = await axios.post(
      YOOKASSA_API_URL,
      {
        amount: { value: product.price, currency: 'RUB' },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description,
        metadata: {
          mongoOrderId: order._id.toString(),
          dbUserId: userId.toString(),
          typeOrder,
          itemCode,
        },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Idempotence-Key': idempotenceKey,
          'Content-Type': 'application/json',
        },
      },
    )

    res.status(200).json({
      success: true,
      confirmationUrl: response.data.confirmation.confirmation_url,
      
    })
  } catch (error) {
    console.error(
      'Payment Create Error:',
      error.response?.data || error.message,
    )
    res
      .status(500)
      .json({ message: 'Ошибка формирования платежа через ЮKassa' })
  }
}

/// Обработчик вебхуков ЮKassa
const handleWebhookYookassa = async (req, res) => {
  try {
    const { event, object } = req.body
    

    if (event === 'payment.succeeded') {
      const { mongoOrderId, dbUserId, typeOrder, itemCode } =
        object.metadata

      // 1. Атомарно обновляем статус заказа
      const order = await Order.findByIdAndUpdate(
        mongoOrderId,
        { status: 'completed' },
        { new: true },
      )

      if (!order) {
        console.error(
          `Order ${mongoOrderId} not found during webhook processing`,
        )
        return res.status(404).send('Order not found')
      }

      // 2. Начисляем бенефиты пользователю в зависимости от типа заказа
      if (typeOrder === 'premium_subscription') {
        const product = PREMIUM_PRODUCTS[itemCode]
        const expiresAt = new Date()
        expiresAt.setDate(
          expiresAt.getDate() + (product.durationDays || 30),
        )

        await User.findByIdAndUpdate(dbUserId, {
          isPremium: true,
          premiumExpiresAt: expiresAt,
        })

      } else if (typeOrder === 'course_purchase') {
        await User.findByIdAndUpdate(dbUserId, {
          $addToSet: { activePurchasedCourses: itemCode }, // addToSet защищает от дублирования кода курса
        })
      
      }
    }
    // ЮKassa всегда ожидает 200 OK
    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook Error:', error)
    res.status(500).send('Internal Server Error')
  }
}

/**
 * Вебхук обработки платежных уведомлений от серверов ВКонтакте (Голоса)
 * Размещается в paymentController.js и защищается мидлваром verifyVkPaymentSignature
 * POST /api/pay/vk-callback
 */
const handleVkPaymentWebhook = async (req, res) => {
  const { notification_type, item, order_id, status } = req.body
  
  // vkId извлечен и проброшен как String внутри вашего мидлвара проверки подписи платежа
  const vkId = req.vkId 

  try {
    // --- ФАЗА 1: ЗАПРОС ИНФОРМАЦИИ О ТОВАРЕ (СИНХРОНИЗАЦИЯ КАТАЛОГА С СЕРВЕРАМИ ВК) ---
    if (
      notification_type === 'get_item' ||
      notification_type === 'get_item_test'
    ) {
      const product = PREMIUM_PRODUCTS[item]

      if (!product) {
        console.error(`[VK Webhook Error] ❌ Тариф "${item}" не найден в константах PREMIUM_PRODUCTS`)
        return res.status(404).json({ error: 'Товара нет в списке доступных тарифов' })
      }

      console.log(`[VK Webhook Catalog] 📦 Сервер ВК успешно синхронизировал данные о тарифе: ${item}`)
      return res.json({
        response: {
          item_id: item,
          title: product.title,
          price: product.votesPrice,
        },
      })
    }

    // --- ФАЗА 2: ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА (ФАКТИЧЕСКОЕ НАЧИСЛЕНИЕ PREMIUM) ---
    if (
      (notification_type === 'order_status_change' ||
        notification_type === 'order_status_change_test') &&
      status === 'chargeable'
    ) {
      const orderId = String(order_id)

      // 1. Идемпотентность: Проверяем транзакцию на дубликаты по уникальному orderId от ВК
      const existingOrder = await Order.findOne({ orderId })
      if (existingOrder) {
        console.log(`[VK Webhook] ⚠️ Повторный колбэк для заказа ВК #${orderId}. Начисление пропущено (дубликат).`)
        return res.json({
          response: { 
            order_id: Number(orderId), 
            app_order_id: String(existingOrder._id) 
          },
        })
      }

      // 2. Валидация оплачиваемого тарифа
      const product = PREMIUM_PRODUCTS[item]
      if (!product) {
        console.error(`[VK Webhook Error] ❌ Ошибка: ВК прислал оплату за неизвестный тариф "${item}"`)
        return res.status(400).json({ error: 'Неверный код тарифа при смене статуса' })
      }

      // 3. Поиск существующего пользователя Говорикс по vkId (строго как в вашем claimVkBonus)
      const user = await User.findOne({ vkId })
      if (!user) {
        console.error(`[VK Webhook Error] ❌ Критическая ошибка: Пользователь с vkId "${vkId}" не найден при оплате заказа ВК #${orderId}!`)
        return res.status(404).json({ error: 'User not found in Govorix database' })
      }

      // 4. Фиксируем транзакцию в коллекции заказов (передаем user._id как ObjectId согласно вашей схеме)
      const newOrder = await Order.create({
        orderId,
        userId: user._id, // Связываем через легальный ObjectId вашего документа User
        typeOrder: 'premium_subscription',
        itemCode: item,
        paymentMethod: 'vk_votes', 
        amount: parseFloat(product.votesPrice), // Записываем цену в голосах
        status: 'completed',
      })

      // 5. Расчет даты окончания подписки (premiumExpiresAt)
      const now = new Date()
      let baseDate = now

      // Если у пользователя уже активен Premium и дата окончания в будущем — продлеваем её кумулятивно
      if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
        baseDate = new Date(user.premiumExpiresAt)
      }

      // Добавляем дни тарифа к базовой дате на основе вашего поля durationDays
      baseDate.setDate(baseDate.getDate() + product.durationDays)
      
      // Обновляем премиум-поля пользователя Говорикс
      user.isPremium = true
      user.premiumExpiresAt = baseDate

      await user.save()
      console.log(`[VK Webhook Success] 🎉 Тариф "${item}" успешно активирован для vkId: ${vkId}. Подписка активна до: ${baseDate.toISOString()}. Заказ в БД #${newOrder._id}`)

      // Возвращаем строго валидный формат ответа по спецификации ВКонтакте
      return res.json({
        response: { 
          order_id: Number(orderId), 
          app_order_id: String(newOrder._id) 
        },
      })
    }

    // На все остальные типы уведомлений ВК отдаем стандартный ок-ответ
    return res.json({ response: 'ok' })

  } catch (error) {
    console.error('❌ Критическая ошибка в handleVkPaymentWebhook:', error)
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера при обработке покупки',
    })
  }
}



const fakeBuyPremium = async (req, res) => {
  try {
    const userId = req.userId // приведен к стандарту checkAuth
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isPremium: true, premiumExpiresAt: expiresAt },
      { new: true },
    )

    if (!updatedUser)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    res.json({
      success: true,
      message:
        'Имитация: Премиум статус успешно активирован на 30 дней!',
      isPremium: updatedUser.isPremium,
      premiumExpiresAt: updatedUser.premiumExpiresAt,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при симуляции активации премиум-статуса',
    })
  }
}

const fakeBuyCourse = async (req, res) => {
  try {
    const { courseCode } = req.body
    const userId = req.userId

    const user = await User.findById(userId)
    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    if (user.activePurchasedCourses.includes(courseCode)) {
      return res
        .status(400)
        .json({ message: 'Этот интенсив вами уже приобретен' })
    }

    user.activePurchasedCourses.push(courseCode)
    await user.save()

    res.status(200).json({
      success: true,
      message:
        'Имитация: Оплата успешно симулирована. Доступ к интенсиву открыт!',
      activePurchasedCourses: user.activePurchasedCourses,
    })
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Ошибка при симуляции оплаты курса' })
  }
}

export {
  createPaymentYookassa,
  handleWebhookYookassa,
  handleVkPaymentWebhook,
}
