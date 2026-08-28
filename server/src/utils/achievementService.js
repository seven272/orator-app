import dayjs from 'dayjs'

import { ACHIEVEMENT_LIST } from '../constants/achievements.js'

const checkAchievements = (
  user,
  hasJustCompletedIrlChallenge = false,
  currentScore = 0,
  currentExerciseAlias = '',
) => {
  const newAchievements = []
  const existingCodes = user.progression.achievements.map(
    (a) => a.code,
  )

  const add = (code, title) => {
    if (!existingCodes.includes(code)) {
      const achievement = { title, code, unlockedAt: new Date() }
      user.progression.achievements.push(achievement)
      newAchievements.push(achievement)
    }
  }

  // --- СТАРЫЕ И БАЗОВЫЕ УСЛОВИЯ ---
  if (user.stats.totalExercises >= 1) add('first_step', 'Первый шаг')
  if (user.progression.level >= 5) add('level_5', 'Оратор 5 уровня')
  if (user.progression.level >= 10)
    add('level_10', 'Гроссмейстер речи')
  if (user.streak.current >= 3) add('streak_3', 'Стабильный оратор')
  if (user.streak.current >= 7) add('streak_7', 'Неделя на кураже')

  const debateStats = user.stats.exerciseStats.find(
    (s) => s.alias === 'ai-debate',
  )
  if (debateStats?.completionsCount >= 5)
    add('ai_debate_5', 'Мастер споров')

  // --- ЕЖЕДНЕВНАЯ АКТИВНОСТЬ (Триатлон) ---
  const todayStr = dayjs().format('YYYY-MM-DD')
  const todayExercisesCount = user.dailyProgress
    .filter((task) => task.date === todayStr)
    .reduce((sum, task) => sum + (task.currentValue || 0), 0)

  if (todayExercisesCount >= 3) add('triple_combo', 'Триатлон')

  // --- ПРОКАЧКА ФИРМЕННЫХ ВЕТОК НАВЫКОВ ---

  // 1. Техника речи (tongue-twister, fear-explosive)
  const techniqueStats = user.stats.exerciseStats.filter((s) =>
    [
      'tongue-twister',
      'fear-explosive',
      'ai-poem-rap',
      'ai-poem-tongue',
      'ai-radio-host',
    ].includes(s.alias),
  )
  const totalTechniquePoints = techniqueStats.reduce(
    (sum, s) => sum + (s.totalPoints || 0),
    0,
  )
  if (totalTechniquePoints >= 1500)
    add('skill_max_technique', 'Золотой голос')

  // 2. Коммуникация (ai-icebreaker, ai-interview, description)
  const communicationStats = user.stats.exerciseStats.filter((s) =>
    [
      'ai-icebreaker',
      'ai-interview',
      'description',
      'ai-bagrain',
    ].includes(s.alias),
  )
  const totalCommunicationPoints = communicationStats.reduce(
    (sum, s) => sum + (s.totalPoints || 0),
    0,
  )
  if (totalCommunicationPoints >= 1500)
    add('social_magnet', 'Магнит внимания')

  // 3. Находчивость (association, synonyms, description, taboo)
  const resourcefulnessStats = user.stats.exerciseStats.filter((s) =>
    [
      'association',
      'synonyms',
      'taboo',
      'ai-metaphor',
      'ai-stop-word',
      'ai-random-word',
    ].includes(s.alias),
  )
  const totalResourcefulnessPoints = resourcefulnessStats.reduce(
    (sum, s) => sum + (s.totalPoints || 0),
    0,
  )
  if (totalResourcefulnessPoints >= 1500)
    add('improv_king', 'Король экспромта')

  // 💡 Ачивка прохождения курса
  if (currentExerciseAlias === 'course_master') {
    add('course_master', 'Выпускник академии')
  }

  // --- СИТУАТИВНЫЕ РЕКОРДЫ И СТАТУСЫ ---

  // 4. Железные аргументы (Идеальные дебаты с ИИ от 95 баллов)
  if (currentExerciseAlias === 'ai-debate' && currentScore >= 95) {
    add('iron_arguments', 'Железные аргументы')
  }

  // 5. Закрытый клуб (Если у юзера активирован Premium-статус)
  if (user.isPremium === true) {
    add('premium_club', 'Закрытый клуб')
  }

  // 6. Марафонец (Глобальный сквозной опыт за все время)
  if (user.stats.lifetimeXp >= 25000) {
    add('marathon_runner', 'Марафонец')
  }

  // --- ЧЕЛЛЕНДЖИ РЕАЛЬНОГО МИРА ---
  if (hasJustCompletedIrlChallenge)
    add('irl_pioneer', 'Покоритель реальности')

  // === ЖИВЫЕ ДУЭЛИ (Проверка по алиасу из вашего контроллера) ===
  if (currentExerciseAlias === 'live-duel') {
    add('live_pioneer', 'Мастер дуэлей')
  }

  return newAchievements
}
export { checkAchievements }
