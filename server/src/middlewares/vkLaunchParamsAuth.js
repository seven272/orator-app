import crypto from 'crypto'

const verifyVkSignature = (req, res, next) => {
  // 1. Извлекаем строку запуска (из body при входе, либо из сохраненного состояния)
  const launchParams = req.body.launchParams || req.query.launchParams

  if (!launchParams) {
    return res
      .status(400)
      .json({ message: 'Параметры запуска не переданы' })
  }

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

  // 2. Валидация "свежести" (не более 11 часов)
  const vkTs = parseInt(params.vk_ts, 10)
  const now = Math.floor(Date.now() / 1000)
  if (!vkTs || Math.abs(now - vkTs) > 40800) {
    return res
      .status(403)
      .json({
        message: 'Срок действия параметров запуска ВКонтакте истек',
      })
  }

  // 3. Формируем строку проверки без encodeURIComponent (как в твоем оригинале)
  const checkString = Object.keys(params)
    .filter((key) => key.startsWith('vk_'))
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const secretKey = process.env.VK_SECRET_KEY
  if (!secretKey) {
    console.error(
      'КРИТИЧЕСКАЯ ОШИБКА: Переменная VK_SECRET_KEY не задана в .env',
    )
    return res
      .status(500)
      .json({ message: 'Ошибка конфигурации сервера' })
  }

  // 4. Считаем хэш
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '')

  if (hash !== sign) {
    return res
      .status(403)
      .json({ message: 'Ошибка валидации: подпись не совпадает' })
  }

  // Сохраняем в объект запроса метаданные ВК для ленивой регистрации
  req.vkId = String(params.vk_user_id)
  req.vkParamsData = {
    firstName: params.vk_first_name || '',
    lastName: params.vk_last_name || '',
    avatar: params.vk_photo_200 || '',
  }

  next()
}

export default verifyVkSignature
