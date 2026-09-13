import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Модернизированная функция под паттерн Local-First Guest
 * userId — передаем для обычных юзеров, null — для гостей
 * guestData — передаем ТОЛЬКО для гостей { vkId, vkParams }, null — для обычных
 */
// - Опция httpOnly в значении true запрещает клиентскому JavaScript изменять эту куку. Изменения могут быть инициированы только сервером.
// - опция secure указывает, что данная кука будет отправляться только через защищенное https соединение
// - Опция maxAge определяет сколько времени (в миллисекундах) браузер должен хранить куку до ее автоматического удаления
// - Опция sameSite определяет, когда браузеры отправляют файлы cookie при межсайтовых запросах. 'strict' только мой сайт может отпралять куки
const createToken = (res, userId, guestData = null) => {
  // 1. Формируем полезную нагрузку в зависимости от статуса гостя
  const payload = guestData
    ? {
        isGuest: true,
        vkId: guestData.vkId,
        vkParams: guestData.vkParams,
      }
    : { userId: userId, isGuest: false }

  // 2. Гостевой токен живет 3 дня, постоянный — 30 дней
  const expiresInDays = guestData ? 3 : 30

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${expiresInDays}d`,
  })

  // 3. Выставляем куку с учетом кроссплатформенности под ВК
  res.cookie('jwt-oratory', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'none' для продакшна (чтобы куки работали внутри iframe ВК),
    // 'lax' для локальной разработки на localhost (так как strict/none не заведутся на http)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    partitioned: process.env.NODE_ENV === 'production', // ДОБАВЛЯЕМ ДЛЯ КОРРЕКТНОЙ РАБОТЫ В IFRAME VK
    maxAge: expiresInDays * 24 * 60 * 60 * 1000,
  })

  return token
}

export default createToken
