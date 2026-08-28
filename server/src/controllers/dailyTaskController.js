import User from '../models/User.js'
import DailyTask from '../models/DailyTask.js'
import Task from '../models/Task.js'

const getDailyTasks = async (req, res) => {
  try {
    const userId = req.userId
    const today = new Date().toISOString().split('T')[0] // Формат "2023-10-27"

    // 1. Ищем, определены ли общие задачи на сегодня
    let challenge = await DailyTask.findOne({
      date: today,
    }).populate('tasks')

    // 2. Если на сегодня задач еще нет (первый юзер зашел в систему) — генерируем
    if (!challenge) {
      const [t1] = await Task.aggregate([
        //aggregate всегда возвращает массив, даже если выбрана одна
        { $match: { level: 1 } }, // Этап 1: Фильтрация ($match)
        { $sample: { size: 1 } }, // Этап 2: Случайный выбор ($sample)
      ])
      const [t2] = await Task.aggregate([
        { $match: { level: 2 } },
        { $sample: { size: 1 } },
      ])
      const [t3] = await Task.aggregate([
        { $match: { level: 3 } },
        { $sample: { size: 1 } },
      ])

      challenge = await DailyTask.create({
        date: today,
        tasks: [t1._id, t2._id, t3._id],
      })

      // Снова подтягиваем данные после создания
      challenge = await DailyTask.findById(challenge._id).populate(
        'tasks',
      )
    }

    // 3. Получаем данные пользователя для проверки прогресса и премиума
    const user = await User.findById(userId)

    // 4. Формируем ответ, совмещая данные задачи и личный прогресс юзера
    const tasksWithProgress = challenge.tasks.map((task) => {
      const userProgress = user.dailyProgress.find(
        (p) =>
          p.taskId.toString() === task._id.toString() &&
          p.date === today,
      )

      return {
        ...task._doc,
        // Блокируем Level 3, если нет премиума
        locked: task.level === 3 && !user.isPremium,
        // Передаем текущий прогресс
        currentValue: userProgress ? userProgress.currentValue : 0,
        isCompleted: userProgress ? userProgress.isCompleted : false,
      }
    })

    res.status(201).json({
      date: today,
      tasks: tasksWithProgress,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка получения ежедневных заданий' })
  }
}

export { getDailyTasks }
