import cron from 'node-cron'
import User from '../models/User.js'
import UserChallenge from '../models/UserChallenge.js'
import LiveDuel from '../models/LiveDuel.js'

const initCronJobs = () => {
  // Выражение '0 0 * * 1' означает: Ровно в 00:00, каждый понедельник (1)
  cron.schedule(
    '0 0 * * 1',
    async () => {
      console.log(
        '⏳ [Cron]: Запуск автоматического сброса недельного рейтинга...',
      )

      try {
        // Массово обновляем всех пользователей, устанавливая weeklyXp в 0
        const result = await User.updateMany(
          {},
          { $set: { weeklyXp: 0 } },
        )

        console.log(
          `✅ [Cron]: Недельный рейтинг успешно сброшен. Обновлено пользователей: ${result.modifiedCount}`,
        )

        // 2. 🔥 Очищаем таблицу выполненных челленджей, делая их доступными заново
        const challengeResult = await UserChallenge.deleteMany({})
        console.log(
          `✅ [Cron]: Статусы еженедельных челленджей очищены. Удалено записей: ${challengeResult.deletedCount}`,
        )
      } catch (error) {
        console.error(
          '❌ [Cron]: Ошибка при сбросе недельного рейтинга:',
          error,
        )
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow', // Установите часовой пояс вашего основного пула пользователей
    },
  )

  // 2. МОДИФИЦИРОВАННЫЙ КРОН: Запуск каждые 30 минут для очистки "протухших" комнат дуэлей
  cron.schedule('*/30 * * * *', async () => {
    console.log(
      '⏳ [Cron]: Запуск проверки и очистки неактуальных комнат дуэлей...',
    )
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

      // ВЕТКА А: Быстрый поиск и Прямые ссылки
      // Ключи изменены под camelCase: creationType, createdAt
      const instantRoomsResult = await LiveDuel.updateMany(
        {
          status: 'pending',
          creationType: { $in: ['quick_search', 'direct_link'] },
          createdAt: { $lt: thirtyMinutesAgo },
        },
        { $set: { status: 'canceled' } },
      )

      // ВЕТКА Б: Календарные слоты
      // Ключи изменены под camelCase: creationType, scheduledAt
      const calendarRoomsResult = await LiveDuel.updateMany(
        {
          status: 'pending',
          creationType: 'calendar',
          scheduledAt: { $lt: fifteenMinutesAgo }, // Время начала дуэли уже позади
        },
        { $set: { status: 'canceled' } },
      )

      // ВЕТКА В: Жесткое удаление абсолютно неактуального мусора (например, отмененных комнат старше 7 дней)
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      )

      const cleanTrashResult = await LiveDuel.deleteMany({
        status: 'canceled', // Удаляем только отмененные. 'completed' НЕ ТРОГАЕМ!
        createdAt: { $lt: sevenDaysAgo },
      })

      if (cleanTrashResult.deletedCount > 0) {
        console.log(
          `🧹 [Cron Log]: Физически удалено старых отмененных комнат: ${cleanTrashResult.deletedCount}`,
        )
      }

      const totalCanceled =
        instantRoomsResult.modifiedCount +
        calendarRoomsResult.modifiedCount

      if (totalCanceled > 0) {
        console.log(
          `✅ [Cron Log]: Очистка завершена. Отменено комнат: ${totalCanceled} ` +
            `(Мгновенных/Ссылок: ${instantRoomsResult.modifiedCount}, Календарных: ${calendarRoomsResult.modifiedCount})`,
        )
      }
    } catch (error) {
      console.error(
        '❌ [Cron Error]: Ошибка при очистке комнат:',
        error,
      )
    }
  })
}

export { initCronJobs }
