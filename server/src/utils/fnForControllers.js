import dayjs from 'dayjs'

import { checkAchievements } from './achievementService.js'
import DailyTask from '../models/DailyTask.js'

// Мягкая прогрессия: каждый уровень требует на 500 XP больше предыдущего
const getXpThreshold = (level) => {
  if (level <= 1) return 1000
  return 1000 + (level - 1) * 500 
}

/**
 * Универсальный движок зачисления прогресса для ИИ-тренажеров
 */
const applyAiGamificationProgress = async (
  user,
  score,
  exAlias,
  exerciseTitle = 'Тренажжер ИИ',
  isDaily = false,
) => {
  const now = new Date()
  const todayStr = dayjs().format('YYYY-MM-DD')
  const todayMs = new Date(now).setUTCHours(0, 0, 0, 0)

  // 1. Расчет календарного стрика активности (UTC 00:00:00)
  const lastDate = user.streak.lastCompletedDate
    ? new Date(user.streak.lastCompletedDate).setUTCHours(0, 0, 0, 0)
    : null
  const oneDayInMs = 86400000

  if (!lastDate) {
    user.streak.current = 1
  } else if (todayMs === lastDate + oneDayInMs) {
    user.streak.current += 1
  } else if (todayMs > lastDate + oneDayInMs) {
    user.streak.current = 1
  }
  user.streak.lastCompletedDate = now

  // 2. Вычисление множителя опыта за серию дней
  let multiplier = 1
  if (user.streak.current >= 3) multiplier = 1.2
  if (user.streak.current >= 7) multiplier = 1.5

  // 1 балл от ИИ = 1 XP
  let baseEarnedXp = Math.round(score * multiplier)
  let baseEarnedCoins = Math.max(Math.floor(baseEarnedXp / 10), 1)

  let dailyBonusXp = 0
  let dailyBonusCoins = 0
  let dailyTaskUpdate = null

  // 3. ЛОГИКА DAILY CHALLENGE ДЛЯ ИИ (Полная копия обычного тренажера)
  if (isDaily) {
    // Ищем пул задач, назначенных системой на сегодняшнюю дату
    const dailySet = await DailyTask.findOne({
      date: todayStr,
    }).populate('tasks')

    // Проверяем, входит ли текущее ИИ-упражнение в сегодняшний пул
    const currentTask = dailySet?.tasks.find(
      (t) => t.alias === exAlias,
    )

    if (currentTask) {
      // Ищем в документе пользователя прогресс по этой ИИ-задаче за сегодня
      let pIndex = user.dailyProgress.findIndex(
        (p) =>
          p.taskId.toString() === currentTask._id.toString() &&
          p.date === todayStr,
      )

      let isJustCompleted = false
      let isCompleted = false

      // Вариант А: Пользователь еще не делал эту задачу сегодня
      if (pIndex === -1) {
        isCompleted = currentTask.goal <= 1

        user.dailyProgress.push({
          taskId: currentTask._id, // Пишем реальный ObjectId из БД!
          currentValue: 1,
          date: todayStr,
          isCompleted: isCompleted,
        })
        pIndex = user.dailyProgress.length - 1

        if (isCompleted) isJustCompleted = true

        // Вариант Б: Запись прогресса уже есть, и она не была завершена ранее
      } else if (!user.dailyProgress[pIndex].isCompleted) {
        user.dailyProgress[pIndex].currentValue += 1

        if (
          user.dailyProgress[pIndex].currentValue >= currentTask.goal
        ) {
          user.dailyProgress[pIndex].isCompleted = true
          isJustCompleted = true
        }
      }

      // Формируем объект обновления для фронтенда
      dailyTaskUpdate = {
        alias: exAlias,
        isCompleted: user.dailyProgress[pIndex].isCompleted,
        currentValue: user.dailyProgress[pIndex].currentValue,
      }

      // 🟢 БУСТ Х2 за ИИ-упражнение дня!
      baseEarnedXp = baseEarnedXp * 2
      baseEarnedCoins = baseEarnedCoins * 2

      if (isJustCompleted) {
        dailyBonusXp = currentTask.reward
        dailyBonusCoins = 10
      }
    }
  }

  // Итоговые награды с учетом бустов и бонусов за дейлик
  const earnedXp = baseEarnedXp + dailyBonusXp
  const earnedCoins = baseEarnedCoins + dailyBonusCoins

  // 4. Зачисление наград в профиль 
  user.stats.lifetimeXp += earnedXp
  user.weeklyXp += earnedXp
  user.progression.xp += earnedXp
  user.progression.coins += earnedCoins
  user.stats.totalExercises = (user.stats.totalExercises || 0) + 1

  // 5. Цикл динамического повышения уровней ("Стакан")
  let isLevelUp = false
  while (
    user.progression.xp >= getXpThreshold(user.progression.level)
  ) {
    user.progression.xp -= getXpThreshold(user.progression.level)
    user.progression.level += 1
    isLevelUp = true
  }

  // 6. СБОР СТАТИСТИКИ УПРАЖНЕНИЯ
  const statIndex = user.stats.exerciseStats.findIndex(
    (ex) => ex.alias === exAlias,
  )
  if (statIndex > -1) {
    user.stats.exerciseStats[statIndex].totalPoints += score
    user.stats.exerciseStats[statIndex].completionsCount += 1
  } else {
    user.stats.exerciseStats.push({
      alias: exAlias,
      title: exerciseTitle,
      totalPoints: score,
      completionsCount: 1,
    })
  }

  // 7. Проверка ачивок (передаем чистый объект user)
  const newAwards = checkAchievements(user, false, score, exAlias)

  if (newAwards && newAwards.length > 0) {
    user.progression.lastAwarded = newAwards
  } else {
    user.progression.lastAwarded = []
  }

  await user.save()

  const completedDays = [
    ...new Set(
      user.dailyProgress
        .filter((item) => item.isCompleted === true)
        .map((item) => item.date),
    ),
  ]

  return {
    earnedXp, 
    earnedCoins,
    isLevelUp,
    newAchievements: newAwards || [],
    daily_task_update: dailyTaskUpdate, // Передаем на фронтенд для галочки дейлика!
    stats: {
      level: user.progression.level,
      xp: user.progression.xp,
      coins: user.progression.coins,
      streak: user.streak.current,
      completed_days: completedDays,
      nextThreshold: getXpThreshold(user.progression.level),
    },
  }
}

export { getXpThreshold, applyAiGamificationProgress }
