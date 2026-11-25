import { RANKS } from '../constants/ranks.js'
import { trackRankUpEvent } from './feedService.js'

/**
 * Рассчитывает текущий ранг, статусы всех 4 замков для перехода
 * и флаг доступности кнопки повышения ранга.
 */
export const calculateSpeakerProgress = (user) => {
  const currentRankIndex = user.progression?.speakerRank ?? 0
  const currentStage =
    RANKS.find((r) => r.rankIndex === currentRankIndex) || RANKS[0]
  const nextStage =
    RANKS.find((r) => r.rankIndex === currentRankIndex + 1) || null

  const stagesTimeline = RANKS.map((stage) => ({
    rankIndex: stage.rankIndex,
    minXp: stage.minXp,
    title: stage.title,
    audience: stage.audience,
    desc: stage.desc,
    mic: stage.mic,
    isReached: currentRankIndex >= stage.rankIndex,
    isCurrent: currentRankIndex === stage.rankIndex,
  }))

  // Если достигнут максимальный ранг (Легенда)
  if (!currentStage.nextRankRequirements || !nextStage) {
    return {
      currentRank: {
        rankIndex: currentStage.rankIndex,
        title: currentStage.title,
        audience: currentStage.audience,
        mic: currentStage.mic,
        desc: currentStage.desc,
      },
      nextRank: null,
      stagesTimeline,
      isMaxRank: true,
      canRankUp: false,
      completedCount: 4,
      totalCount: 4,
      requirements: null,
    }
  }

  const reqs = currentStage.nextRankRequirements
  const userLifetimeXp = user.stats?.lifetimeXp || 0

  // 1. Базовое условие А: XP
  const isXpDone = userLifetimeXp >= reqs.requiredXp
  const xpPercent = Math.min(
    Math.round((userLifetimeXp / reqs.requiredXp) * 100),
    100,
  )

  // 2. Базовое условие Б: ИИ-тренажеры (максимум всегда 100 баллов)
  const exercisesProgress = reqs.exercises.map((reqEx) => {
    const userStat = user.stats?.exerciseStats?.find(
      (s) => s.alias === reqEx.alias,
    )
    const bestScore = Math.min(userStat?.bestScore || 0, 100)
    const minRequired = reqEx.minScore ?? reqEx.minPercent

    return {
      alias: reqEx.alias,
      title: reqEx.title,
      minScore: minRequired,
      bestScore,
      isDone: bestScore > minRequired,
    }
  })

  const areExercisesDone = exercisesProgress.every((ex) => ex.isDone)

  // Общий замок для финальных испытаний (Экзамен + Практика в жизни)
  const isTrialsUnlocked = isXpDone && areExercisesDone

  const challengeRecord = user.progression?.rankChallenges?.find(
    (c) => c.targetRank === reqs.targetRank,
  )

  // 3. Финальное испытание А: Экзамен
  const examBestScore = challengeRecord?.examBestScore || 0
  const isExamDone =
    Boolean(challengeRecord?.examPassed) ||
    examBestScore > reqs.exam.minScore

  // 4. Финальное испытание Б: Задание в реальной жизни
  const isRealTaskDone = Boolean(challengeRecord?.realTaskCompleted)

  // Подсчет закрытых блоков для компактного бейджа (например, "2/4")
  const completedCount = [
    isXpDone,
    areExercisesDone,
    isExamDone,
    isRealTaskDone,
  ].filter(Boolean).length

  const canRankUp = completedCount === 4

  return {
    currentRank: {
      rankIndex: currentStage.rankIndex,
      title: currentStage.title,
      audience: currentStage.audience,
      mic: currentStage.mic,
      desc: currentStage.desc,
    },
    nextRank: {
      rankIndex: nextStage.rankIndex,
      title: nextStage.title,
      audience: nextStage.audience,
      mic: nextStage.mic,
    },
    stagesTimeline,
    isMaxRank: false,
    canRankUp,
    completedCount,
    totalCount: 4,
    requirements: {
      xp: {
        current: userLifetimeXp,
        required: reqs.requiredXp,
        percent: xpPercent,
        isDone: isXpDone,
      },
      exercises: {
        items: exercisesProgress,
        isDone: areExercisesDone,
      },
      exam: {
        alias: reqs.exam.alias,
        title: reqs.exam.title,
        description: reqs.exam.description,
        minScore: reqs.exam.minScore,
        bestScore: examBestScore,
        isUnlocked: isTrialsUnlocked,
        isDone: isExamDone,
      },
      realWorldTask: {
        targetRank: reqs.targetRank,
        title: reqs.realWorldTask.title,
        description: reqs.realWorldTask.description,
        isUnlocked: isTrialsUnlocked,
        isDone: isRealTaskDone,
        feedback: challengeRecord?.realTaskFeedback || '',
      },
    },
  }
}

/**
 * Явное повышение ранга пользователя по кнопке
 */
export const promoteUserRank = async (user) => {
  const progress = calculateSpeakerProgress(user)

  if (progress.isMaxRank) {
    throw new Error('Вы уже достигли максимального ранга «Легенда»')
  }

  if (!progress.canRankUp) {
    throw new Error(
      'Не все условия для перехода на следующий ранг выполнены',
    )
  } 

  user.progression.speakerRank += 1
   
  await user.save()

   if (progress.canRankUp) {
      trackRankUpEvent(user._id, user.progression.speakerRank)
    } 

  return calculateSpeakerProgress(user)
}
