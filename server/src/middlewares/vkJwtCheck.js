import jwt from 'jsonwebtoken'

const checkVkId = (req, res, next) => {
  // 1. Достаем JWT из  кастомного заголовка
  // Express автоматически приводит названия заголовков к нижнему регистру
  const vkToken = req.headers['x-vk-user-id']

  if (!vkToken) {
    return res.status(401).json({
      message: 'Доступ запрещен: отсутствует заголовок X-VK-User-Id',
    })
  }

  // Убираем 'Bearer ', если вы передаете его в этом заголовке
  const cleanToken = vkToken.replace(/Bearer\s?/, '')

  try {
    // 2. Проверяем  внутренний JWT, созданный ранее на бэкенде
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET)

    // 3. Сохраняем реальный VK ID из токена в объект запроса
    // Важно: при генерации токена (jwt.sign) поле должно называться 'vkId'
    req.vkId = String(decoded.vkId)

    next()
  } catch (error) {
    return res.status(403).json({
      message: 'Не удалось пройти проверку подлинности аккаунта',
    })
  }
}

export default checkVkId
