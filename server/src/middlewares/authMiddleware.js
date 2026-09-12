import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import createToken from '../utils/createToken.js'

// Базовый мидлвар авторизации (Требует жесткой регистрации)
const checkAuth = async (req, res, next) => {
  const token = req.cookies['jwt-oratory']

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Не получилось авторизоваться - токен не найден',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Если токен валиден, но это гость — запрещаем доступ туда, где нужен реальный аккаунт
    if (decoded.isGuest) {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_REQUIRED',
        message:
          'Для выполнения этого действия необходимо завершить регистрацию',
      })
    }

    req.userId = decoded.userId
    req.user = await User.findById(decoded.userId).select('-password')

    if (!req.user) {
      return res
        .status(404)
        .json({ success: false, message: 'Пользователь не найден' })
    }

    next()
  } catch (error) {
    console.log('Ошибка в checkAuth middleware: ', error)
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Не получилось авторизоваться - токен не валиден',
      })
    }
    return res
      .status(500)
      .json({ success: false, message: 'Ошибка сервера' })
  }
}

// Мягкий (необязательный) мидлвар — пропускает Гостей к ИИ-тренажерам 1 и 2 уровней
// Мягкий мидлвар (Пропускает гостей ВК к упражнениям 1 и 2 уровня)
const optionalAuth = async (req, res, next) => {
  const token = req.cookies['jwt-oratory']

  if (!token) {
    return next() // Идем дальше как аноним
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.isGuest) {
      req.isGuest = true
      req.vkId = decoded.vkId
      req.vkParamsData = decoded.vkParamsData
    } else if (decoded.userId) {
      req.userId = decoded.userId
      req.user = await User.findById(decoded.userId).select(
        '-password',
      )
    }
  } catch (error) {
    console.log(
      'Необязательная авторизация: токен невалиден, отдаем как гостю',
    )
    console.log(error)
  }

  next()
}

// МИДЛВАР ЛЕНИВОЙ РЕГИСТРАЦИИ (Для отправки отчетов по челленджам, покупок и т.д.)
const enforceRegistration = async (req, res, next) => {
  const token = req.cookies['jwt-oratory']

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        code: 'REGISTRATION_REQUIRED',
        message: 'Авторизация отсутствует',
      })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Если это полноценный юзер — просто прокидываем дальше
    if (!decoded.isGuest) {
      req.userId = decoded.userId
      req.user = await User.findById(decoded.userId).select(
        '-password',
      )
      return next()
    }

    // МАГИЯ: Автоматически регистрируем Гостя ВК в MongoDB в один клик
    const { vkId, vkParamsData } = decoded

    let user = await User.findOne({ vkId: String(vkId) })

    if (!user) {
      // Генерация защищенного случайного никнейма Спикер#7284
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const guestNickname = `${vkParamsData?.firstName || 'Спикер'}#${randomDigits}`

      user = await User.create({
        displayName: guestNickname,
        firstName: vkParamsData?.firstName || '',
        lastName: vkParamsData?.lastName || '',
        avatar: vkParamsData?.avatar || '',
        vkId: String(vkId),
        authProvider: 'vk',
        registeredFrom: 'vk',
        socialProfilesData: {
          vk: {
            firstName: vkParamsData?.firstName || '',
            lastName: vkParamsData?.lastName || '',
            avatar: vkParamsData?.avatar || '',
          },
        },
      })
    }

    // Перезаписываем куку jwt-oratory с гостевой на постоянную (isGuest: false)
    // Твоя функция createToken обновит куку в браузере автоматически
    createToken(res, user._id)

    req.userId = user._id
    req.user = user

    next()
  } catch (error) {
    console.error('Ошибка ленивой регистрации:', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Внутренняя ошибка при создании профиля',
      })
  }
}

const checkAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Вы не являетесь администратором',
    })
  }
}

const checkPremium = async (req, res, next) => {
  try {
    // Данные уже лежат в req.user благодаря вашему checkAuth!
    const user = req.user

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // 1. Проверяем наличие премиума
    if (!user.isPremium) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        message:
          'Для доступа к этому тренажеру необходим Премиум-статус',
      })
    }

    // 2. Проверяем срок действия подписки
    if (
      user.premiumExpiresAt &&
      new Date() > new Date(user.premiumExpiresAt)
    ) {
      // Так как подписка истекла, здесь НАМ НАДО обновить базу данных
      user.isPremium = false
      user.premiumExpiresAt = null
      await user.save() // Сохраняем изменения в БД

      return res.status(403).json({
        code: 'PREMIUM_EXPIRED',
        message: 'Срок действия вашего Премиум-статуса истек',
      })
    }

    // Если всё отлично, передаем управление ИИ-контроллеру
    next()
  } catch (error) {
    console.error('Ошибка в checkPremium middleware:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export {
  checkAuth,
  checkAdmin,
  optionalAuth,
  enforceRegistration,
  checkPremium,
}
