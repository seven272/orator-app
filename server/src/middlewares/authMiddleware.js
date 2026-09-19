import jwt from 'jsonwebtoken'
import User from '../models/User.js'

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

    // 🔥 Если токен валиден, но это ГОСТЬ ВК — блокируем запрос!
    if (decoded.isGuest) {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_REQUIRED',
        message:
          'Для выполнения этого действия необходимо сохранить аккаунт ВК',
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
// МЯГКИЙ МИДЛВАР (Пропускает абсолютно всех: анонимов, гостей ВК, юзеров).Используется на упражнениях 1 и 2 уровня, ленте активности и витринах.
const optionalAuth = async (req, res, next) => {
  const token = req.cookies['jwt-oratory']

  if (!token) {
    req.isGuest = true
    return next() // Токена нет — идет дальше как аноним сайта
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.isGuest) {
      // Пользователь — подтвержденный гость из ВК
      req.isGuest = true
      req.vkId = decoded.vkId
      req.vkParamsData = decoded.vkParamsData
    } else if (decoded.userId) {
      // Пользователь — постоянный аккаунт из базы данных
      req.isGuest = false
      req.userId = decoded.userId
      req.user = await User.findById(decoded.userId).select(
        '-password',
      )
    }
  } catch (error) {
    console.log(
      'Необязательная авторизация не прошла, отдаем как гостю',
    )
    console.log(error)
    req.isGuest = true
  }

  next()
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

export { checkAuth, checkAdmin, optionalAuth }
