import crypto from 'crypto'

const verifyVkSignature = (req, res, next) => {
  // 1. Продвинутое извлечение: проверяем, прислал ли фронтенд строку или уже готовый объект параметров
  const { launchParams } = req.body

  if (!launchParams) {
    return res.status(400).json({ message: 'Параметры запуска не переданы' })
  }

  let queryParams = {}

  // Если пришла строка (начинается с ? или содержит vk_) — парсим её
  if (typeof launchParams === 'string') {
    const cleanParamsString = launchParams.startsWith('?') ? launchParams.slice(1) : launchParams
    const urlParams = new URLSearchParams(cleanParamsString)
    for (const [key, value] of urlParams.entries()) {
      queryParams[key] = value
    }
  } else if (typeof launchParams === 'object') {
    // Если фронтенд прислал уже готовый чистый объект параметров
    queryParams = { ...launchParams }
  }

  const { sign, ...params } = queryParams

  // 2. Валидация "свежести" (оставляем твою рабочую логику)
  const vkTs = parseInt(params.vk_ts, 10)
  const now = Math.floor(Date.now() / 1000)
  if (!vkTs || Math.abs(now - vkTs) > 40800) {
    return res.status(403).json({ message: 'Срок действия параметров запуска ВКонтакте истек' })
  }

  // 3. Формируем строку проверки без encodeURIComponent (как в твоем оригинале)
  const checkString = Object.keys(params)
    .filter((key) => key.startsWith('vk_'))
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const secretKey = process.env.VK_SECRET_KEY
  if (!secretKey) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Переменная VK_SECRET_KEY не задана в .env')
    return res.status(500).json({ message: 'Ошибка конфигурации сервера' })
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
    return res.status(403).json({ message: 'Ошибка валидации: подпись не совпадает' })
  }
 
  req.vkId = String(params.vk_user_id)
  req.vkParamsData = {
    firstName: params.vk_first_name || '',
    lastName: params.vk_last_name || '',
    avatar: params.vk_photo_200 || ''
  }
console.log(params)
  next()
}

export default verifyVkSignature

