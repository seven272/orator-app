import FeedEvent from '../models/FeedEvent.js'

//  Сервис для автоматической генерации событий прохождения тренажера, очков > 80 и нового уровня пользователся ДЛЯ УПРАЖНЕНИЙ 1 и 2 Уровня
// const trackExerciseProgress = async ({
//   userId,
//   exerciseAlias,
//   exerciseTitle,
//   score,
//   userStats,
//   isLevelUp,
//   newLevel,
// }) => {
//   try {
//     // --- ТРИГГЕР 1: ПОВЫШЕНИЕ УРОВНЯ / РАНГА (Если сработал Level Up) ---
//     if (isLevelUp) {
//       await FeedEvent.create({
//         user: userId,
//         type: 'RANK_UP',
//         meta: {
//           // Передаем новый уровень. На фронтенде по цифре уровня (например, 5)
//           // можно сопоставить текстовое звание на таймлайне (например, "Спикер TED")
//           newRank: `${newLevel} уровня`,
//         },
//       })
//     }

//     // Ищем статистику конкретного упражнения в объекте юзера
//     const exerciseStat = userStats.find(
//       (stat) => stat.alias === exerciseAlias,
//     )
//     if (!exerciseStat) return

//     const currentCompletions = exerciseStat.completionsCount

//     // --- ТРИГГЕР 2: ВЫСОКИЙ БАЛЛ (Score > 80) ---
//     if (score && score > 80) {
//       await FeedEvent.create({
//         user: userId,
//         type: 'EXERCISE_TOP_SCORE',
//         meta: {
//           exerciseTitle,
//           score,
//         },
//       })
//     }

//     // --- ТРИГГЕР 3: ЮБИЛЕЙНОЕ ПРОХОЖДЕНИЕ (Кратно 5 или 10) ---
//     if (currentCompletions > 0 && currentCompletions % 5 === 0) {
//       await FeedEvent.create({
//         user: userId,
//         type: 'EXERCISE_MILESTONE',
//         meta: {
//           exerciseTitle,
//           completionsCount: currentCompletions,
//         },
//       })
//     }
//   } catch (error) {
//     console.error(
//       'Ошибка при генерации события активности в feedService:',
//       error,
//     )
//   }
// }

// Публикация о покупке/активации Premium-подписки
const trackPremiumPurchase = async (userId) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'PREMIUM_BUY',
      meta: {}, // Для подписки нам достаточно знать автора, текст соберется на фронте
    })
  } catch (error) {
    console.error(
      'Ошибка трекинга покупки премиума для ленты:',
      error,
    )
  }
}

// Публикация об успешной сдаче челленджа реального мира
const trackChallengeCompletion = async (userId, challengeTitle) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'CHALLENGE_DONE',
      meta: {
        eventTargetName: challengeTitle, // Передаем название выполненного квеста
      },
    })
  } catch (error) {
    console.error(
      'Ошибка трекинга выполнения челленджа для ленты:',
      error,
    )
  }
}

// Старт курса
const trackCourseStarted = async (userId, courseTitle) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'COURSE_STARTED',
      meta: { eventTargetName: courseTitle }, // 🔔 Универсальный ключ
    })
  } catch (error) {
    console.error(error)
  }
}

// Успешный финал курса
const trackCourseCompleted = async (userId, courseTitle) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'COURSE_COMPLETED',
      meta: { eventTargetName: courseTitle }, // 🔔 Универсальный ключ
    })
  } catch (error) {
    console.error(error)
  }
}

//  Покупка в магазине оратора
const trackShopPurchase = async (userId, itemTitle) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'SHOP_PURCHASE',
      meta: { eventTargetName: itemTitle }, // 🔔 Универсальный ключ
    })
  } catch (error) {
    console.error(error)
  }
}

// Отслеживает высокие баллы, круглые юбилеи прохождений и недельные стрики
 const trackStreakAndMilestones = async ({ userId, exerciseAlias, exerciseTitle, score, userStats, streakDays }) => {
  try {
    // 1. Проверка ударного режима (стрика): публикуем каждые 7 дней
    if (streakDays > 0 && streakDays % 7 === 0) {
      await FeedEvent.create({
        user: userId,
        type: 'STREAK_WEEK',
        meta: { streakDays }
      });
    }

    // Ищем статистику по конкретному упражнению
    const exerciseStat = userStats.find(stat => stat.alias === exerciseAlias);
    if (!exerciseStat) return;

    const currentCompletions = exerciseStat.completionsCount;

    // 2. Проверка высокого балла от ИИ
    if (score && score > 80) {
      await FeedEvent.create({
        user: userId,
        type: 'EXERCISE_TOP_SCORE',
        meta: {
          exerciseTitle,
          score
        }
      });
    }

    // 3. Проверка юбилея прохождений (кратно 5)
    if (currentCompletions > 0 && currentCompletions % 5 === 0) {
      await FeedEvent.create({
        user: userId,
        type: 'EXERCISE_MILESTONE',
        meta: {
          exerciseTitle,
          completionsCount: currentCompletions
        }
      });
    }
  } catch (error) {
    console.error('Ошибка трекинга милстоунов в feedService:', error);
  }
};


 // Публикация в ленту информации о полученных ачивках
const trackNewAchievements = async (userId, achievementsArray) => {
  try {
    // Если пользователь за один раз получил несколько ачивок, пушим их по отдельности
    for (const award of achievementsArray) {
      await FeedEvent.create({
        user: userId,
        type: 'ACHIEVEMENT_UNLOCKED',
        meta: {
          eventTargetName: award.title // Передаем красивое название ("Мастер споров") в универсальное поле
        }
      });
    }
  } catch (error) {
    console.error('Ошибка публикации ачивки в ленту:', error);
  }
};


 // Публикация о повышении уровня (Level Up)
const trackLevelUpEvent = async (userId, newLevel) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'RANK_UP',
      meta: {
        newRank: `${newLevel} уровня`
      }
    });
  } catch (error) {
    console.error('Ошибка публикации левелапа в ленту:', error);
  }
};

//  Сундук с призыми
const trackWeeklyPrize = async (userId, itemTitle) => {
  try {
    await FeedEvent.create({
      user: userId,
      type: 'WEEKLY_PRIZE',
      meta: { eventTargetName: itemTitle }, // 🔔 Универсальный ключ
    })
  } catch (error) {
    console.error(error)
  }
}


export {
  trackPremiumPurchase,
  trackChallengeCompletion,
  trackCourseStarted,
  trackCourseCompleted,
  trackShopPurchase,
  trackStreakAndMilestones,
  trackNewAchievements,
  trackLevelUpEvent,
  trackWeeklyPrize
}
