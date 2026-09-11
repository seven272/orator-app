import FeedEvent from '../models/FeedEvent.js'

/**
 * Получение последних событий сообщества («Пульс»)
 */
const getFeed = async (req, res) => {
  try {
    // 🔔 ИЗМЕНЕНО: Запрашиваем displayName вместо username, учитывая структуру вашей модели User
    const events = await FeedEvent.find()
      .populate('user', 'displayName avatar isPremium')
      .sort({ createdAt: -1 })
      .limit(30)

    // Безопасно маппим данные для фронтенда
    const formattedEvents = events.map((event) => {
      // Заглушка на случай, если пользователь по какой-то причине был удален из БД
      const author = event.user || {
        displayName: 'Пользователь Govorix',
        isPremium: false,
        avatar: '',
      }

      return {
        id: event._id,
        type: event.type,
        meta: event.meta,
        createdAt: event.createdAt,
        author: {
          displayName:
            author.displayName ||
            `${author.firstName || ''} ${author.lastName || ''}`.trim() ||
            'Спикер Govorix',
          avatar: author.avatar,
          isPremium: author.isPremium,
        },
        congratulationsCount: event.congratulatedBy.length,
        // Проверяем, реагировал ли уже текущий залогиненный пользователь
        isCongratulatedByMe: req.userId
          ? event.congratulatedBy.includes(req.userId)
          : false,
      }
    })

    return res.status(200).json({
      success: true,
      data: formattedEvents,
    })
  } catch (error) {
    console.error('Ошибка в getFeed контроллере: ', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Ошибка сервера при загрузке ленты',
      })
  }
}

/**
 * Простановка реакции (Поздравление / Огонек 🔥) событию
 */
const congratulateEvent = async (req, res) => {
  const { id } = req.params
  const currentUserId = req.userId // Достаем из checkAuth мидлвара

  try {
    const event = await FeedEvent.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Событие не найдено' })
    }

    // Защита: нельзя поздравлять самого себя
    if (event.user.toString() === currentUserId.toString()) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Нельзя хвалить самого себя',
        })
    }

    // Проверяем, лайкал ли уже
    if (event.congratulatedBy.includes(currentUserId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Вы уже поддержали это достижение',
        })
    }

    // Добавляем ID пользователя в массив
    event.congratulatedBy.push(currentUserId)
    await event.save()

    return res.status(200).json({
      success: true,
      message: 'Реакция успешно добавлена',
      congratulationsCount: event.congratulatedBy.length,
      isCongratulatedByMe: true,
    })
  } catch (error) {
    console.error('Ошибка в congratulateEvent контроллере: ', error)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Ошибка сервера при отправке реакции',
      })
  }
}

export { congratulateEvent, getFeed }
