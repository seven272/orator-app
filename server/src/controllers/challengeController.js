import Challenge from '../models/Challenge.js'
import UserChallenge from '../models/UserChallenge.js'
import User from '../models/User.js' 
import { checkAchievements } from '../utils/achievementService.js'

// 1. Получить все челленджи с текущим статусом пользователя
const getChallenges = async (req, res) => {
  try {
    const userId = req.userId

    // Берем все глобальные челленджи
    const allChallenges = await Challenge.find({})

    // Берем прогресс конкретного пользователя
    const userProgress = await UserChallenge.find({ userId })

    // Скрещиваем данные, Сопоставляем глобальные челленджи с прогрессом конкретного юзера
    const challengesList = allChallenges.map((ch) => {
      const progress = userProgress.find(
        (p) => p.challengeId.toString() === ch._id.toString(),
      )
      return {
        id: ch._id,
        code: ch.code,
        title: ch.title,
        description: ch.description,
        targetSkill: ch.targetSkill,
        instruction: ch.verificationInstruction,
        reward: ch.reward,
        status: progress ? progress.status : 'active', // по умолчанию доступен для выполнения
        textReport: progress?.submissionData?.textReport || '',
      }
    })

    res.status(200).json(challengesList)
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: 'Ошибка при получении челленджей' })
  }
}

// 2. Отправить текстовый отчет о выполнении (MVP без проверки ИИ)
const submitChallengeReport = async (req, res) => {
  try {
    const userId = req.userId
    const { challengeId, textReport } = req.body

    if (!textReport || textReport.trim().length < 10) {
      return res.status(400).json({
        message:
          'Напишите чуть более подробный отчет (минимум 10 символов).',
      })
    }

    const challenge = await Challenge.findById(challengeId)
    if (!challenge)
      return res.status(404).json({ message: 'Челлендж не найден' })

    // Проверяем, не выполнял ли его уже юзер
    const existingProgress = await UserChallenge.findOne({
      userId,
      challengeId,
    })
    if (existingProgress && existingProgress.status === 'completed') {
      return res
        .status(400)
        .json({ message: 'Этот челлендж уже выполнен!' })
    }

    // 💡 Начисляем награду пользователю с учетом вашей логики «Стакана»
    const user = await User.findById(userId)
    if (!user)
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })

    const earnedXp = challenge.reward.xp
    const earnedCoins = challenge.reward.coins

    // Логика добавления очков
    user.stats.lifetimeXp += earnedXp
    user.weeklyXp += earnedXp
    user.progression.coins += earnedCoins
    user.progression.xp += earnedXp

    // «Система стакана» уровней (Линейно-прогрессивная)
    // Порог уровня = 1000 + (level - 1) * 500
    let nextThreshold = 1000 + (user.progression.level - 1) * 500
    while (user.progression.xp >= nextThreshold) {
      user.progression.xp -= nextThreshold
      user.progression.level += 1
      nextThreshold = 1000 + (user.progression.level - 1) * 500 // пересчитываем для следующего шага цикла
    }

    // Фиксируем выполнение в UserChallenge
    await UserChallenge.findOneAndUpdate(
      { userId, challengeId },
      {
        status: 'completed',
        submissionData: { textReport },
        completedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    const newAwards = checkAchievements(user, true)
    
    await user.save()

    res.status(200).json({
      message: 'Челлендж успешно засчитан!',
      reward: challenge.reward,
      user: {
        level: user.progression.level,
        xp: user.progression.xp,
        coins: user.progression.coins,
        lifetimeXp: user.stats.lifetimeXp,
        newAchievements: newAwards || [],
      },
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ошибка при отправке отчета' })
  }
}
export { submitChallengeReport, getChallenges }
