import crypto from 'crypto'

const verifyVkSignature = (req, res, next) => {
  // 1. Продвинутое извлечение: проверяем, прислал ли фронтенд строку или уже готовый объект параметров
  const launchParams =
    req.body.launchParams || req.query.launchParams || req.body

  if (!launchParams) {
    console.warn(
      'verifyVkSignature: Параметры запуска не переданы в запросе',
    )
    return res
      .status(400)
      .json({ message: 'Параметры запуска не переданы' })
  }
  let queryParams = {}

  // Если пришла строка (начинается с ? или содержит vk_) — парсим её
  if (typeof launchParams === 'string') {
    const cleanParamsString = launchParams.startsWith('?')
      ? launchParams.slice(1)
      : launchParams
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
  const THIRTY_DAYS_IN_SECONDS = 2592000

  if (!vkTs || Math.abs(now - vkTs) > THIRTY_DAYS_IN_SECONDS) {
    // 🛠️ Добавили логирование, чтобы бэкенд перестал молчать в консоли
    console.error(
      `verifyVkSignature ❌ Срок действия параметров истек. vk_ts: ${vkTs}, текущее время: ${now}, разница: ${now - vkTs} сек.`,
    )
    return res.status(403).json({
      message: 'Срок действия параметров запуска ВКонтакте истек',
    })
  }
  // 3. Формируем строку проверки без encodeURIComponent
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
    console.error(
      `verifyVkSignature ❌ Ошибка валидации: подпись не совпадает. Ожидался: ${sign}, рассчитан: ${hash}`,
    )
    return res
      .status(403)
      .json({ message: 'Ошибка валидации: подпись не совпадает' })
  }

  req.vkId = String(params.vk_user_id)

  next()
}

const verifyVkPaymentSignature = (req, res, next) => {
  const data = req.body
  const secretKey = process.env.VK_SECRET_KEY

  // 1. Проверка наличия входящих данных и подписи ВК
  if (!data || !data.sig) {
    console.error(
      '[VK Payment Middleware] ❌ Ошибка: платежные данные или подпись (sig) отсутствуют в req.body',
    )
    return res.status(400).json({ error: 'Missing signature' })
  }

  if (!secretKey) {
    console.error(
      '[VK Payment Middleware] ❌ Критическая ошибка: Переменная VK_SECRET_KEY не задана в файле .env',
    )
    return res
      .status(500)
      .json({ error: 'Server configuration error' })
  }

  // 2. Формируем строку для хэширования согласно спецификации платежей VK
  // Извлекаем все ключи, убираем саму подпись 'sig', сортируем строго по алфавиту
  const paramsString = Object.keys(data)
    .filter((key) => key !== 'sig')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('') // Склеиваем параметры в сплошную строку БЕЗ разделителей вроде '&'

  // 3. Вычисляем MD5 хэш: MD5(конкатенация_параметров + secretKey)
  const calculatedHash = crypto
    .createHash('md5')
    .update(paramsString + secretKey)
    .digest('hex')

  // 4. Сверка вычисленного хэша с подписью, присланной сервером ВК
  if (calculatedHash.toLowerCase() !== data.sig.toLowerCase()) {
    console.error(
      '[VK Payment Middleware] ❌ Критическая ошибка: Контрольные подписи не совпадают!',
    )
    console.error(
      '-> Рассчитано сервером Govorix:',
      calculatedHash.toLowerCase(),
    )
    console.error(
      '-> Получено от ВКонтакте (sig):',
      data.sig.toLowerCase(),
    )
    return res.status(403).json({ error: 'Invalid signature' })
  }

  // 🤖 УДОБСТВО: Безопасно сохраняем строковый vkId в объект запроса для нашего платежного контроллера
  if (data.user_id) {
    req.vkId = String(data.user_id)
  }

  next() // Валидация пройдена успешно, передаем управление платежному контроллеру
}

export { verifyVkSignature, verifyVkPaymentSignature }
