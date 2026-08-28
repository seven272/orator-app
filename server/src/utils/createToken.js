import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

const createToken = (res, userId) => {
  const token = jwt.sign({ userId: userId }, JWT_SECRET, {
    expiresIn: '30d',
  })
  // сохраняю куки.
  // - Опция httpOnly в значении true запрещает клиентскому JavaScript изменять эту куку. Изменения могут быть инициированы только сервером.
  // - опция secure указывает, что данная кука будет отправляться только через защищенное https соединение
  // - Опция maxAge определяет сколько времени (в миллисекундах) браузер должен хранить куку до ее автоматического удаления
  // - Опция sameSite определяет, когда браузеры отправляют файлы cookie при межсайтовых запросах. 'strict' только мой сайт может отпралять куки
  res.cookie('jwt-oratory', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    samesite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  })

  return token
}

export default createToken