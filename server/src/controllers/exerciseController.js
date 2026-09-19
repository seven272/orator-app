import User from '../models/User.js'
import { All_EXERCISES } from '../constants/exercises.js'
import { applyAiGamificationProgress } from '../utils/fnForControllers.js'

const completeExercise = async (req, res) => {
  try {
    const { exAlias, score, isDaily } = req.body

    // 🔥 1. ОБРАБОТКА ГОСТЕВОГО РЕЖИМА
    if (req.isGuest) {
      return res.status(200).json({
        success: true,
        isGuest: true,
        message: 'Результат гостя обработан локально',
        score,
        exAlias
      })
    }

    // 2. Ищем метаданные упражнения
    const exercise = Object.values(All_EXERCISES)
      .flat()
      .find((ex) => ex.alias === exAlias)

    if (!exercise) {
      return res.status(404).json({ message: 'Упражнение не найдено' })
    }

    // 3. Загружаем документ пользователя (req.user уже подгружен и обновлен мидлваром энергии!)
    const user = req.user
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    // 4. Применяем геймификацию (опыт, монеты, ачивки)
    const gamificationResult = await applyAiGamificationProgress(
      user,
      score,
      exAlias,
      exercise.title,
      isDaily,
    )

    // 5. Возвращаем успешный ответ + актуальное состояние энергии для UI
    res.status(200).json({
      success: true,
      message: 'Прогресс сохранен',
      dailyEnergy: {
        allowed: user.dailyEnergy.allowed,
        used: user.dailyEnergy.used,
      },
      ...gamificationResult,
    })
  } catch (error) {
    console.error('Ошибка в completeExercise:', error)
    res.status(500).json({ message: 'Ошибка при сохранении результата' })
  }
}

export { completeExercise }
