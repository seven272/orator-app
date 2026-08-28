import crypto from 'crypto'

/**
 * Middleware для проверки подписи платежных уведомлений ВК
 */
const vkAuthMiddleware = (req, res, next) => {
  const data = req.body
  const secretKey = process.env.VK_SECRET_KEY

  // 1. Проверка наличия данных и подписи
  if (!data || !data.sig) {
    console.error('Ошибка: данные или подпись (sig) отсутствуют')
    return res.status(400).json({ error: 'Missing signature' })
  }

  if (!secretKey) {
    console.error('Ошибка: VK_SECRET_KEY не задан в .env')
    return res
      .status(500)
      .json({ error: 'Server configuration error' })
  }

  // 2. Формируем строку для хэширования
  // Берем ВСЕ ключи, сортируем их по алфавиту, исключаем 'sig'
  const paramsString = Object.keys(data)
    .filter((key) => key !== 'sig')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('')

  // 3. Вычисляем MD5: MD5(конкатенация_параметров + secretKey)
  const calculatedHash = crypto
    .createHash('md5')
    .update(paramsString + secretKey)
    .digest('hex')

  // 4. Сверка подписей
  if (calculatedHash.toLowerCase() !== data.sig.toLowerCase()) {
    console.error('Критическая ошибка: Подписи не совпадают!')
    console.log('Ожидалось:', calculatedHash)
    console.log('Получено (data.sig):', data.sig)
    return res.status(403).json({ error: 'Invalid signature' })
  }

  next() // Все хорошо, передаем управление следующему обработчику
}

export default vkAuthMiddleware
