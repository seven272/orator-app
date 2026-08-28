import crypto from 'crypto'

const verifyVkSignature = (req, res, next) => {
  // 1. Ожидаем строку window.location.search целиком в теле запроса
  const { launchParams } = req.body

  if (!launchParams) {
    return res
      .status(400)
      .json({ message: 'Параметры запуска не переданы' })
  }

  // Извлекаем параметры из строки (убираем '?' в начале, если есть)
  const urlParams = new URLSearchParams(
    launchParams.startsWith('?')
      ? launchParams.slice(1)
      : launchParams,
  )

  const queryParams = {}
  for (const [key, value] of urlParams.entries()) {
    queryParams[key] = value
  }

  const { sign, ...params } = queryParams

  // 2. Проверка времени (vk_ts). Ссылка должна быть "свежей" (например, не старше 3 часов)
  const vkTs = parseInt(params.vk_ts, 10)
  const now = Math.floor(Date.now() / 1000)
  if (!vkTs || Math.abs(now - vkTs) > 40800) {
    return res
      .status(403)
      .json({ message: 'Срок действия параметров запуска истек' })
  }

  // 3. Формируем строку для проверки (только параметры с префиксом vk_)
  // const checkString = Object.keys(params)
  //   .filter((key) => key.startsWith('vk_'))
  //   .sort()
  //   .map(
  //     (key) =>
  //       `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
  //   )
  //   .join('&')

  // 3. Формируем строку для проверки (только параметры с префиксом vk_)
  const checkString = Object.keys(params)
    .filter((key) => key.startsWith('vk_'))
    .sort()
    // Склеиваем ключи и значения БЕЗ encodeURIComponent
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  // 4. Считаем хеш, используя Защищенный ключ (Client Secret) из настроек VK
  const secretKey = process.env.VK_SECRET_KEY
  if (!secretKey) {
    console.error(
      'КРИТИЧЕСКАЯ ОШИБКА: Переменная VK_SECRET_KEY не задана в .env',
    )
    return res
      .status(500)
      .json({ message: 'Ошибка конфигурации сервера' })
  }
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('base64')
    .replace(/\+/g, '-') // Превращаем Base64 в URL-safe формат
    .replace(/\//g, '_')
    .replace(/=$/, '')

  // 5. Сравниваем
  if (hash !== sign) {
    return res
      .status(403)
      .json({ message: 'Ошибка валидации: подпись не совпадает' })
  }

  // Если всё ок, передаем ID пользователя дальше
  req.vkId = params.vk_user_id
  next()
}

export default verifyVkSignature
