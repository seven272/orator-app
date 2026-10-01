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
    console.log(req.body)
    let product = null
    let description = ''

    const returnUrl = isVk
      ? 'https://vk.ru/app54762318'
      : 'https://govorix.ru'

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

    console.log('idempotenceKey ' + idempotenceKey)

    // 🔍 Временный дебаг-лог (проверьте, что выводится в терминал)
    console.log('SHOP_ID:', process.env.YOOKASSA_SHOP_ID)
    console.log(
      'SECRET_KEY ТИП:',
      typeof process.env.YOOKASSA_SECRET_KEY,
      'ДЛИНА:',
      process.env.YOOKASSA_SECRET_KEY?.length,
    )

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
      amount: parseFloat(product.price),
      status: 'created',
    })

    if (order) {
      console.log('Заказ в БД успешно создан')
    }

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

    console.log('ниже ответ от юкассы')
    console.log(response.data.confirmation.confirmation_url)
    
    res.status(200).json({
      success: true,
      confirmationUrl: response.data.confirmation.confirmation_url,
      orderId: idempotenceKey,
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
    console.log('handleWebhookYookassa event ' + event)
    console.log('handleWebhookYookassa object ' + object)

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

        console.log(
          `[PAYMENT SUCCESS] User ${dbUserId} upgraded to Premium until ${expiresAt}`,
        )
      } else if (typeOrder === 'course_purchase') {
        await User.findByIdAndUpdate(dbUserId, {
          $addToSet: { activePurchasedCourses: itemCode }, // addToSet защищает от дублирования кода курса
        })
        console.log(
          `[PAYMENT SUCCESS] User ${dbUserId} unlocked course ${itemCode}`,
        )
      }
    }

    // ЮKassa всегда ожидает 200 OK
    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook Error:', error)
    res.status(500).send('Internal Server Error')
  }
}

const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    console.log("checkOrderStatus " + orderId)

    // Находим заказ в нашей БД
    const order = await Order.findOne({ orderId })

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Заказ не найден' })
    }

    // Возвращаем статус заказа и метаданные, чтобы фронтенд распределил бенефиты в Redux
    res.status(200).json({
      success: true,
      status: order.status, // 'created', 'completed', 'failed'
      typeOrder: order.typeOrder, // 'premium_subscription' или 'course_purchase'
      itemCode: order.itemCode, // код подписки или курс (например, 'sales_master')
    })
  } catch (error) {
    console.error('Check Order Status Error:', error.message)
    res
      .status(500)
      .json({ message: 'Ошибка при проверке статуса платежа' })
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
  checkOrderStatus,
}
