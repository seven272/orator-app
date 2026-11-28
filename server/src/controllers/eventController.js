import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import Event from '../models/Event.js'
import Order from '../models/Order.js'

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments'

// 1. Получить список мероприятий (витрина Афиши с optionalAuth)
const getEventsList = async (req, res) => {
  try {
    const { format, city, onlyMy, includeDrafts } = req.query

    const filter = {}

    // Для админки можно передать includeDrafts=true, для всех остальных — только опубликованные
    if (!(includeDrafts === 'true' && req.user?.isAdmin)) {
      filter.isPublished = true
    }

    if (format && ['online', 'offline'].includes(format)) {
      filter.format = format
    }

    if (city && city.trim() !== '') {
      filter.city = city.trim()
    }

    // Фильтр "Мои билеты"
    if (onlyMy === 'true') {
      if (!req.userId) {
        return res.json({ success: true, events: [] })
      }
      filter['participants.userId'] = req.userId
    }

    const events = await Event.find(filter)
      .select('-secretLocationOrLink')
      .sort({ startDate: 1 })

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const formattedEvents = []

    for (const event of events) {
      // Считаем активные неоплаченные заказы в вашей модели Order за последние 15 минут
      const activePendingCount = await Order.countDocuments({
        typeOrder: 'event_ticket',
        itemCode: event._id.toString(),
        status: 'created',
        createdAt: { $gt: fifteenMinutesAgo },
      })

      const takenSeats =
        event.participants.length + activePendingCount
      const availableSeats = Math.max(0, event.maxSeats - takenSeats)

      const isRegistered = req.userId
        ? event.participants.some(
            (p) => p.userId.toString() === req.userId.toString(),
          )
        : false

      formattedEvents.push({
        _id: event._id,
        title: event.title,
        description: event.description,
        coverImage: event.coverImage,
        format: event.format,
        city: event.city,
        startDate: event.startDate,
        durationMinutes: event.durationMinutes,
        maxSeats: event.maxSeats,
        availableSeats,
        priceRub: event.priceRub,
        isPublished: event.isPublished,
        isRegistered,
      })
    }

    return res.json({ success: true, events: formattedEvents })
  } catch (error) {
    console.error('Ошибка при получении списка мероприятий:', error)
    return res
      .status(500)
      .json({ success: false, message: 'Не удалось загрузить афишу' })
  }
}

// 2. Получить детальную карточку мероприятия (с optionalAuth)
const getEventById = async (req, res) => {
  try {
    const { id } = req.params

    const event = await Event.findById(id)
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Мероприятие не найдено' })
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const activePendingCount = await Order.countDocuments({
      typeOrder: 'event_ticket',
      itemCode: event._id.toString(),
      status: 'created',
      createdAt: { $gt: fifteenMinutesAgo },
    })

    const takenSeats = event.participants.length + activePendingCount
    const availableSeats = Math.max(0, event.maxSeats - takenSeats)

    const isRegistered = req.userId
      ? event.participants.some(
          (p) => p.userId.toString() === req.userId.toString(),
        )
      : false

    const isAdmin = Boolean(req.user && req.user.isAdmin)

    // Закрытую ссылку или адрес отдаем только купившим билет или админу
    const secretLocationOrLink =
      isRegistered || isAdmin ? event.secretLocationOrLink : null

    return res.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        coverImage: event.coverImage,
        format: event.format,
        city: event.city,
        startDate: event.startDate,
        durationMinutes: event.durationMinutes,
        maxSeats: event.maxSeats,
        availableSeats,
        priceRub: event.priceRub,
        isPublished: event.isPublished,
        isRegistered,
        secretLocationOrLink,
      },
    })
  } catch (error) {
    console.error('Ошибка при получении мероприятия:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Не удалось загрузить мероприятие',
      })
  }
}

// 3. Записаться на мероприятие или создать платеж в ЮKassa (с checkAuth)
// Единая точка входа: бесплатная запись или создание платежа в ЮKassa (с checkAuth)
const registerOrCreateEventPayment = async (req, res) => {
  try {
    const { id } = req.params
    const { isVk } = req.body
    const userId = req.userId

    const event = await Event.findById(id)
    if (!event || !event.isPublished) {
      return res
        .status(404)
        .json({ success: false, message: 'Мероприятие не найдено' })
    }

    // 1. Проверяем, не записан ли пользователь уже
    const alreadyRegistered = event.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    )
    if (alreadyRegistered) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Вы уже записаны на это мероприятие',
        })
    }

    // 2. Считаем свободные места (подтвержденные + заказы 'created' за последние 15 минут)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const activePendingCount = await Order.countDocuments({
      typeOrder: 'event_ticket',
      itemCode: event._id.toString(),
      status: 'created',
      createdAt: { $gt: fifteenMinutesAgo },
    })

    if (
      event.participants.length + activePendingCount >=
      event.maxSeats
    ) {
      return res.status(400).json({
        success: false,
        message: 'К сожалению, свободных мест больше нет',
      })
    }

    // 3. СЦЕНАРИЙ А: Бесплатное мероприятие
    if (event.priceRub === 0) {
      event.participants.push({
        userId,
        registeredAt: new Date(),
        attended: false,
      })
      await event.save()

      return res.json({
        success: true,
        isFree: true,
        message: 'Вы успешно записаны на мероприятие!',
      })
    }

    // 4. СЦЕНАРИЙ Б: Платное мероприятие — создаем запись в вашей модели Order
    const idempotenceKey = uuidv4()
    const shopId = String(process.env.YOOKASSA_SHOP_ID).trim()
    const secretKey = String(process.env.YOOKASSA_SECRET_KEY).trim()
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString(
      'base64',
    )

    const returnUrl = isVk
      ? `https://vk.ru{event._id}`
      : `https://govorix.ru{event._id}`

    const order = await Order.create({
      orderId: idempotenceKey,
      userId,
      typeOrder: 'event_ticket',
      itemCode: event._id.toString(),
      paymentMethod: 'yookassa',
      amount: parseFloat(event.priceRub),
      status: 'created',
    })

    // 5. Запрос к API ЮKassa в точном соответствии с вашим вебхуком
    const response = await axios.post(
      YOOKASSA_API_URL,
      {
        amount: {
          value: event.priceRub.toFixed(2),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: `Билет на мероприятие «${event.title}» в Govorix`,
        metadata: {
          mongoOrderId: order._id.toString(),
          dbUserId: userId.toString(),
          typeOrder: 'event_ticket',
          itemCode: event._id.toString(),
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

    return res.status(200).json({
      success: true,
      isFree: false,
      confirmationUrl: response.data.confirmation.confirmation_url,
    })
  } catch (error) {
    console.error(
      'Event Payment Create Error:',
      error.response?.data || error.message,
    )
    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования платежа через ЮKassa',
    })
  }
}

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      coverImage,
      format,
      city,
      secretLocationOrLink,
      startDate,
      durationMinutes,
      maxSeats,
      priceRub,
      isPublished,
    } = req.body

    if (
      !title ||
      !description ||
      !format ||
      !secretLocationOrLink ||
      !startDate ||
      !maxSeats
    ) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все обязательные поля мероприятия',
      })
    }

    if (format === 'offline' && (!city || !city.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Для офлайн-встречи необходимо указать город',
      })
    }

    const newEvent = await Event.create({
      title: title.trim(),
      description,
      coverImage: coverImage || '',
      format,
      city: format === 'offline' ? city.trim() : '',
      secretLocationOrLink: secretLocationOrLink.trim(),
      startDate: new Date(startDate),
      durationMinutes: Number(durationMinutes) || 90,
      maxSeats: Number(maxSeats),
      priceRub: Number(priceRub) || 0,
      isPublished: isPublished !== undefined ? isPublished : true,
    })

    return res.status(201).json({
      success: true,
      event: newEvent,
    })
  } catch (error) {
    console.error('Ошибка при создании мероприятия:', error)
    return res.status(500).json({
      success: false,
      message: 'Не удалось создать мероприятие',
    })
  }
}

// 5. [ADMIN] Обновить мероприятие (с checkAuth + checkAdmin)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      coverImage,
      format,
      city,
      secretLocationOrLink,
      startDate,
      durationMinutes,
      maxSeats,
      priceRub,
      isPublished,
    } = req.body

    const event = await Event.findById(id)
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Мероприятие не найдено' })
    }

    if (title !== undefined) event.title = title.trim()
    if (description !== undefined) event.description = description
    if (coverImage !== undefined) event.coverImage = coverImage
    if (format !== undefined) event.format = format
    if (city !== undefined) {
      event.city = event.format === 'offline' ? city.trim() : ''
    }
    if (secretLocationOrLink !== undefined) {
      event.secretLocationOrLink = secretLocationOrLink.trim()
    }
    if (startDate !== undefined) event.startDate = new Date(startDate)
    if (durationMinutes !== undefined) {
      event.durationMinutes = Number(durationMinutes)
    }
    if (maxSeats !== undefined) event.maxSeats = Number(maxSeats)
    if (priceRub !== undefined) event.priceRub = Number(priceRub)
    if (isPublished !== undefined) event.isPublished = isPublished

    await event.save()
    return res.json({ success: true, event })
  } catch (error) {
    console.error('Ошибка при обновлении мероприятия:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Не удалось обновить мероприятие',
      })
  }
}

// 6. [ADMIN] Удалить мероприятие (с checkAuth + checkAdmin)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params

    const event = await Event.findById(id)
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Мероприятие не найдено' })
    }

    if (event.participants.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'На мероприятие уже есть записавшиеся участники. Скройте его (isPublished: false) вместо удаления.',
      })
    }

    await event.deleteOne()
    return res.json({
      success: true,
      message: 'Мероприятие удалено',
      id,
    })
  } catch (error) {
    console.error('Ошибка при удалении мероприятия:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Не удалось удалить мероприятие',
      })
  }
}

// 7. [ADMIN] Получить список участников мероприятия (с checkAuth + checkAdmin)
const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params

    const event = await Event.findById(id).populate(
      'participants.userId',
      'displayName firstName lastName email vkId avatar progression.speakerRank',
    )

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Мероприятие не найдено' })
    }

    return res.json({
      success: true,
      eventTitle: event.title,
      secretLocationOrLink: event.secretLocationOrLink,
      participants: event.participants,
    })
  } catch (error) {
    console.error('Ошибка при получении списка участников:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Не удалось загрузить участников',
      })
  }
}

export {
  getEventParticipants,
  createEvent,
  deleteEvent,
  updateEvent,
  registerOrCreateEventPayment,
  getEventById,
  getEventsList,
}
