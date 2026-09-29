import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
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
  // Запуск каждые 30 минут для оперативной очистки диска сервера
  cron.schedule('*/5 * * * *', async () => {
    console.log(
      '\n⏳ [Cron]: Старт проверки и очистки асинхронных комнат...',
    )
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      )

      // ==========================================
      // ВЕТКА 1: Отмена протухших комнат ожидания (pending)
      // ==========================================
      const pendingResult = await LiveDuel.updateMany(
        {
          status: 'pending',
          createdAt: { $lt: fifteenMinutesAgo },
        },
        { $set: { status: 'canceled' } },
      )
      if (pendingResult.modifiedCount > 0) {
        console.log(
          `🧹 [Cron]: Отменено комнат ожидания (pending): ${pendingResult.modifiedCount}`,
        )
      }
      // ==========================================
      // ВЕТКА 2: Очистка брошенных активных баттлов (active) + Удаление аудио с диска
      // ==========================================
      // Находим комнаты, застрявшие в active, которые были созданы более 2 часов назад
      const abandonedRooms = await LiveDuel.find({
        status: 'active',
        createdAt: { $lt: twoHoursAgo },
      })

      if (abandonedRooms.length > 0) {
        let deletedFilesCount = 0

        for (const room of abandonedRooms) {
          if (room.audioTracks && room.audioTracks.length > 0) {
            room.audioTracks.forEach((track) => {
              if (track.fileUrl) {
                // Извлекаем относительный путь ("audio/name.ogg") и приводим к абсолютному
                const absolutePath = path.resolve(
                  './src/uploads',
                  track.fileUrl,
                )
                if (fs.existsSync(absolutePath)) {
                  fs.unlink(absolutePath, (err) => {
                    if (err)
                      console.error(
                        `[Cron Storage Error] Не удалось стереть: ${absolutePath}`,
                        err.message,
                      )
                  })
                  deletedFilesCount++
                }
              }
            })
          }
          // Переводим комнату в статус canceled
          room.status = 'canceled'
          await room.save()
        }
        console.log(
          `✅ [Cron]: Закрыто брошенных баттлов: ${abandonedRooms.length}. Удалено застрявших файлов: ${deletedFilesCount}`,
        )
      }

      // ==========================================
      // ВЕТКА 3: Удаление отмененного мусора из MongoDB
      // ==========================================
      const cleanTrashResult = await LiveDuel.deleteMany({
        status: 'canceled',
        createdAt: { $lt: twoDaysAgo },
      })
      if (cleanTrashResult.deletedCount > 0) {
        console.log(
          `🧹 [Cron]: Физически стерто документов отмененных комнат из БД: ${cleanTrashResult.deletedCount}`,
        )
      }

       // ==========================================
      // ВЕТКА 4: Очистка массива аудифйлов в завершенных дуэлях
      // ==========================================
      // Находим завершенные комнаты старше 2 дней, у которых массив аудио еще не очищен
      const optimizeCompletedResult = await LiveDuel.updateMany(
        {
          status: 'completed',
          createdAt: { $lt: twoDaysAgo },
          audioTracks: {  $exists: true, $ne: [] } // Оптимизируем только те, где есть данные
        },
        { 
          $set: { audioTracks: [] } // Полностью зануляем массив треков, сжимая документ до минимума
        }
      )
      
      if (optimizeCompletedResult.modifiedCount > 0) {
        console.log(`💎 [Cron Оптимизация]: Сжато старых завершенных комнат (массивы аудио очищены): ${optimizeCompletedResult.modifiedCount}`)
      }
    } catch (error) {
      console.error(
        '❌ [Cron Critical Error]: Ошибка при фоновом обслуживании комнат:',
        error,
      )
    }
  })

  // ==========================================
  // 3. 🔥 РАЗ В ЧАС: Проверка и сброс Премиума
  // ==========================================
  cron.schedule('0 * * * *', async () => {
    console.log(
      '⏳ [Cron]: Запуск ежечасной проверки истекших премиум-подписок...',
    )

    try {
      const now = new Date()

      const premiumResult = await User.updateMany(
        {
          isPremium: true,
          premiumExpiresAt: { $lt: now }, // дата окончания подписки уже прошла
        },
        {
          $set: {
            isPremium: false,
            premiumExpiresAt: null,
          },
        },
      )

      if (premiumResult.modifiedCount > 0) {
        console.log(
          `✅ [Cron Log]: Ежечасная чистка: аннулировано подписок: ${premiumResult.modifiedCount}`,
        )
      } else {
        console.log(
          '[Cron Log]: Ежечасная чистка: просроченных подписок нет.',
        )
      }
    } catch (error) {
      console.error(
        '❌ [Cron Error]: Ошибка при автоматическом сбросе премиума:',
        error,
      )
    }
  })
}

export { initCronJobs }
