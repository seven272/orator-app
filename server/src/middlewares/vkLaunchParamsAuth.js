import crypto from 'crypto'

const verifyVkSignature = (req, res, next) => {
  const launchParams = req.body.launchParams || req.query.launchParams

  if (typeof launchParams !== 'string' || !launchParams.includes('vk_')) {
    console.error(
      'verifyVkSignature ❌ launchParams не переданы или переданы не строкой:',
      typeof launchParams,
      launchParams,
    )
    return res.status(400).json({ message: 'Параметры запуска не переданы' })
  }

  const clean = launchParams.startsWith('?') ? launchParams.slice(1) : launchParams

  let sign = ''
  const rawParams = []

  for (const pair of clean.split('&')) {
    const eq = pair.indexOf('=')
    const key = eq === -1 ? pair : pair.slice(0, eq)
    const value = eq === -1 ? '' : pair.slice(eq + 1)
    if (key === 'sign') sign = value
    else if (key.startsWith('vk_')) rawParams.push([key, value])
  }

  if (!sign || rawParams.length === 0) {
    return res.status(400).json({ message: 'Параметры запуска некорректны' })
  }

  // Проверка свежести — по сырому значению
  const vkTsPair = rawParams.find(([key]) => key === 'vk_ts')
  const vkTs = vkTsPair ? parseInt(vkTsPair[1], 10) : NaN
  const now = Math.floor(Date.now() / 1000)
  const THIRTY_DAYS = 2592000

  if (!vkTs || Math.abs(now - vkTs) > THIRTY_DAYS) {
    return res.status(403).json({ message: 'Срок действия параметров запуска истек' })
  }

  const checkString = rawParams
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const secretKey = process.env.VK_SECRET_KEY
  if (!secretKey) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: VK_SECRET_KEY не задан')
    return res.status(500).json({ message: 'Ошибка конфигурации сервера' })
  }

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  if (hash !== sign) {
    // Диагностика: видно ровно то, что реально участвует в подписи
    console.error(
      'verifyVkSignature ❌ Подпись не совпадает\n' +
      '  raw:  ' + clean + '\n' +
      '  checkString: ' + checkString + '\n' +
      '  ожидался: ' + sign + '\n' +
      '  рассчитан: ' + hash,
    )
    return res.status(403).json({ message: 'Ошибка валидации: подпись не совпадает' })
  }

  const userIdPair = rawParams.find(([key]) => key === 'vk_user_id')
  req.vkId = userIdPair ? userIdPair[1] : ''

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
