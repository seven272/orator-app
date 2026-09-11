import User from '../models/User.js'
import { All_EXERCISES } from '../constants/exercises.js'
import { applyAiGamificationProgress } from '../utils/fnForControllers.js'

const completeExercise = async (req, res) => {
  try {
    // 1. Извлекаем данные из тела запроса и ID авторизованного пользователя
    const { exAlias, score, isDaily } = req.body
    const userId = req.userId

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

    const gamificationResult = await applyAiGamificationProgress(
      user,
      score,
      exAlias,
      exercise.title,
      isDaily,
    )

    res.status(200).json({
      message: 'Прогресс сохранен',
      ...gamificationResult,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка при сохранении результата' })
  }
}

export { completeExercise }
