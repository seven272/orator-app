const checkCourseAccess = async (req, res, next) => {
  try {
    // Извлекаем courseCode из параметров URL, query или тела запроса
    const courseCode =
      req.params.courseCode ||
      req.body.courseCode ||
      req.query.courseCode

    if (!courseCode) {
      return res
        .status(400)
        .json({
          message: 'Не указан уникальный код интенсива (courseCode)',
        })
    }

    const user = req.user // Данные подтянуты из checkAuth

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Если пользователь админ — пускаем без проверок.
    // Иначе проверяем наличие кода курса в массиве активных покупок
    const hasAccess =
      user.isAdmin || user.activePurchasedCourses.includes(courseCode)

    if (!hasAccess) {
      return res.status(403).json({
        code: 'COURSE_NOT_PURCHASED',
        message:
          'Для доступа к материалам этого интенсива необходимо его приобрести.',
      })
    }

    // Если доступ есть, передаем управление дальше
    next()
  } catch (error) {
    console.error('Ошибка в checkCourseAccess middleware:', error)
    res
      .status(500)
      .json({
        message: 'Внутренняя ошибка сервера при валидации доступа',
      })
  }
}

export { checkCourseAccess }
