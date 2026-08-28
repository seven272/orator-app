import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const checkAuth = async (req, res, next) => {
  // Получаем JWT токен из cookie
  let token = req.cookies['jwt-oratory']

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Не получилось авторизоваться - токен не найден',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Не получилось авторизоваться - токен не валиден',
      })
    }
    //1
    //если достаточно только проверки токена аунтефикации, то сразу отправляем токен с ИД в ответ
    req.userId = decoded.userId
    // 2
    //если нужно еще будет проверять является ли пользователь админом, то находим его в БД
    req.user = await User.findById(decoded.userId).select(
        '-password'
      )
    //3
    // или еще токен можно скалдировать в хранилище locals, которое можно использовать для передачи данных в рамках одного запроса,
    //   res.locals.user = decoded.userId

    next()
  } catch (error) {
    console.log('Ошибка в checkUser middleware: ', error)
    //instanceof проверяет свойство наследования, уточняет, создан ли объект с использованием конкретного прототипа или класса.
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Не получилось авторизоваться - токен не валиден',
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      })
    }
  }
}

const checkAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    res.status(401).send('Вы не являетесь администратором.')
  }
} 

export { checkAuth, checkAdmin }
