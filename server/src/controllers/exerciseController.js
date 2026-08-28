import User from '../models/User.js'
import DailyTask from '../models/DailyTask.js'

import { All_EXERCISES } from '../constants/exercises.js'
import { getXpThreshold } from '../utils/fnForControllers.js'
import { checkAchievements } from '../utils/achievementService.js'

const completeExercise = async (req, res) => {
  try {
    // 1. Извлекаем данные из тела запроса и ID авторизованного пользователя
    const { exAlias, score, isDaily } = req.body
    const userId = req.userId
    // Получаем текущую дату в формате YYYY-MM-DD для работы с базой данных ежедневных заданий
    const todayStr = new Date().toISOString().split('T')[0]

    // 2. Ищем метаданные упражнения в глобальном конфигурационном объекте ALL_EXERCISES
    const exercise = Object.values(All_EXERCISES)
      .flat() // Превращаем объект категорий в плоский массив всех существующих упражнений
      .find((ex) => ex.alias === exAlias)

    if (!exercise)
      return res
        .status(404)
        .json({ message: 'Упражнение не найдено' })

    // 3. Загружаем из базы полный документ пользователя
    const user = await User.findById(userId)
    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    // --- ЛОГИКА СТРИКА (🟢 ТЕПЕРЬ СРАБАТЫВАЕТ ПРИ ЛЮБОМ УПРАЖНЕНИИ) ---
    const now = new Date()
    // Приводим текущее время к 00:00:00.000 по UTC для корректного сравнения календарных дней
    const todayMs = new Date(now).setUTCHours(0, 0, 0, 0)

    // Получаем время последнего успеха пользователя (если оно есть) и тоже приводим к 00:00:00.000 UTC
    const lastDate = user.streak.lastCompletedDate
      ? new Date(user.streak.lastCompletedDate).setUTCHours(
          0,
          0,
          0,
          0,
        )
      : null
    const oneDayInMs = 86400000 // Количество миллисекунд в одном дне

    if (!lastDate) {
      // Случай 1: Самая первая активность на аккаунте — инициализируем стрик на 1 день
      user.streak.current = 1
    } else if (todayMs === lastDate + oneDayInMs) {
      // Случай 2: Прошлый раз был вчера (ровно 1 день назад) — увеличиваем серию дней
      user.streak.current += 1
    } else if (todayMs > lastDate + oneDayInMs) {
      // Случай 3: Пользователь пропустил один или несколько дней — сбрасываем серию до 1 дня
      user.streak.current = 1
    }
    // Обратите внимание: если todayMs === lastDate (пользователь тренируется повторно в тот же день),
    // стрик просто не изменяется. Мы не сбрасываем и не накручиваем его.

    // Вне зависимости от исхода, перезаписываем дату последней активности на текущую
    user.streak.lastCompletedDate = now

    // --- РАСЧЕТ МНОЖИТЕЛЯ СТРИКА ---
    // Определяем коэффициент бонуса в зависимости от текущей непрерывной серии дней
    let multiplier = 1
    if (user.streak.current >= 3) multiplier = 1.2
    if (user.streak.current >= 7) multiplier = 1.5

    // Высчитываем БАЗОВЫЕ награды за саму тренировку: очки умножаем на коэффициент стрика
    let baseEarnedXp = Math.round(score * multiplier)
    let baseEarnedCoins = Math.floor(baseEarnedXp / 10)

    // Инициализируем переменные для бонусов квестов (daily challenges)
    let dailyBonusXp = 0
    let dailyBonusCoins = 0
    let dailyTaskUpdate = null

    // --- ЛОГИКА DAILY CHALLENGE (🟢 ТЕПЕРЬ С БУСТОМ Х2) ---
    if (isDaily) {
      // Ищем пул задач, назначенных системой на сегодняшнюю UTC-дату
      const dailySet = await DailyTask.findOne({
        date: todayStr,
      }).populate('tasks')

      // Проверяем, входит ли текущее выполненное упражнение в этот пул задач
      const currentTask = dailySet?.tasks.find(
        (t) => t.alias === exAlias,
      )

      if (currentTask) {
        // Ищем в документе пользователя прогресс по этой конкретной задаче за сегодня
        let pIndex = user.dailyProgress.findIndex(
          (p) =>
            p.taskId.toString() === currentTask._id.toString() &&
            p.date === todayStr,
        )

        // Триггеры для точной фиксации момента завершения (чтобы не выдать награду дважды)
        let isJustCompleted = false
        let isCompleted = false

        // Вариант А: Пользователь еще не делал эту задачу сегодня
        if (pIndex === -1) {
          // Если цель задачи требует всего 1 повторение (goal <= 1), то квест сразу выполнен
          isCompleted = currentTask.goal <= 1

          // Добавляем новую запись прогресса в массив пользователя
          user.dailyProgress.push({
            taskId: currentTask._id,
            currentValue: 1,
            date: todayStr,
            isCompleted: isCompleted,
          })
          pIndex = user.dailyProgress.length - 1 // Запоминаем индекс только что созданной записи

          if (isCompleted) isJustCompleted = true // Если цель достигнута сразу — активируем триггер

          // Вариант Б: Запись прогресса уже есть, и задача еще НЕ была выполнена до конца ранее
        } else if (!user.dailyProgress[pIndex].isCompleted) {
          // Увеличиваем счетчик текущих выполнений на 1
          user.dailyProgress[pIndex].currentValue += 1

          // Проверяем, достиг ли пользователь нужной планки (goal)
          if (
            user.dailyProgress[pIndex].currentValue >=
            currentTask.goal
          ) {
            user.dailyProgress[pIndex].isCompleted = true // Переводим статус в выполненное
            isJustCompleted = true // Активируем триггер награды
          }
        }

        // Собираем объект обновления для фронтенда, чтобы UI мог красиво перерисовать галочку или прогресс-бар
        dailyTaskUpdate = {
          alias: exAlias,
          isCompleted: user.dailyProgress[pIndex].isCompleted,
          currentValue: user.dailyProgress[pIndex].currentValue,
        }

        // 🟢 БУСТ: Так как это упражнение дня, мы удваиваем базовый опыт и монеты за саму тренировку
        baseEarnedXp = baseEarnedXp * 2
        baseEarnedCoins = baseEarnedCoins * 2

        // Если квест (цель по повторениям) закрылся именно в этой сессии — добавляем фиксированный бонус сверху
        if (isJustCompleted) {
          dailyBonusXp = currentTask.reward // Награда за опыт из настроек задачи
          dailyBonusCoins = 10 // Фиксированные 10 «Жетонов оратора»
        }
      }
    }

    // Итоговые награды: суммируем базу (которая могла удвоиться выше) и бонусы за дейлик
    const earnedXp = baseEarnedXp + dailyBonusXp
    const earnedCoins = baseEarnedCoins + dailyBonusCoins

    // Начисляем заработанное в профиль пользователя
    user.stats.lifetimeXp += earnedXp // Опыт за все время (для глобального рейтинга)
    user.progression.xp += earnedXp // Опыт в "стакан" для текущего уровня
    user.progression.coins += earnedCoins // Игровая валюта
    user.weeklyXp += earnedXp // Опыт для недельной лиги

    // --- LEVEL UP (Ваш цикл "Стакана") ---
    let isLevelUp = false
    // Пока текущий опыт больше или равен порогу ТЕКУЩЕГО уровня — выполняем повышение.
    // Благодаря циклу, если получен огромный бонус, пользователь перескочит сразу через несколько уровней.
    while (
      user.progression.xp >= getXpThreshold(user.progression.level)
    ) {
      // Вычитаем стоимость текущего уровня из накопленного опыта
      user.progression.xp -= getXpThreshold(user.progression.level)
      // Повышаем уровень в профиле на 1
      user.progression.level += 1
      isLevelUp = true // Взводим флаг для фронтенда (чтобы запустить анимацию)
    }

    // --- СБОР СТАТИСТИКИ УПРАЖНЕНИЯ ---
    // Ищем, выполнял ли пользователь данное упражнение когда-либо в прошлом
    const statIndex = user.stats.exerciseStats.findIndex(
      (ex) => ex.alias === exAlias,
    )

    if (statIndex > -1) {
      // Если выполнял — суммируем набранные «чистые» баллы и увеличиваем счетчик попыток
      user.stats.exerciseStats[statIndex].totalPoints += score
      user.stats.exerciseStats[statIndex].completionsCount += 1
    } else {
      // Если это первый запуск в истории аккаунта — пушим новый объект статистики
      user.stats.exerciseStats.push({
        alias: exAlias,
        title: exercise.title,
        totalPoints: score,
        completionsCount: 1,
      })
    }
    // Увеличиваем глобальный счетчик абсолютно всех тренировок на платформе
    user.stats.totalExercises = (user.stats.totalExercises || 0) + 1

    // Собираем массив уникальных строковых дат, в которые были полностью закрыты дейлики
    const completedDays = [
      ...new Set(
        user.dailyProgress
          .filter((item) => item.isCompleted === true)
          .map((item) => item.date),
      ),
    ] 

    // Запускаем внешнюю проверку на получение новых достижений/ачивок: (user, hasJustCompletedIrlChallenge, currentScore, currentExerciseAlias)
    const newAwards = checkAchievements(user, false, score, exAlias)

    //  Сохраняем все изменения документа в базу данных MongoDB
    await user.save()

    // 5. Возвращаем клиенту успешный ответ со всеми обновленными данными для синхронизации Redux
    res.status(200).json({
      message: 'Прогресс сохранен',
      earnedXp,
      earnedCoins,
      isLevelUp,
      newAchievements: newAwards || [],
      daily_task_update: dailyTaskUpdate, // Информация о прогрессе дейлика (или null, если не дейлик)
      stats: {
        level: user.progression.level,
        xp: user.progression.xp,
        coins: user.progression.coins, 
        streak: user.streak.current,
        completed_days: completedDays,
        // Считаем порог уже для СЛЕДУЮЩЕГО уровня, чтобы фронтенд правильно отрисовал шкалу прогресса
        nextThreshold: getXpThreshold(user.progression.level),
      },
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка при сохранении результата' })
  }
}

export { completeExercise }
