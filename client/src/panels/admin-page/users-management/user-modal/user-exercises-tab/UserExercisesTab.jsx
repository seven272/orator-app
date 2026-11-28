import React from 'react'
import styles from './UserExercisesTab.module.css'

const UserExercisesTab = ({ exerciseStats = [] }) => {
  if (!exerciseStats || exerciseStats.length === 0) {
    return (
      <div className={styles.empty_state}>
        Пользователь еще не проходил упражнения в тренажерах.
      </div>
    )
  }

  // Сортируем по количеству прохождений от большего к меньшему
  const sortedStats = [...exerciseStats].sort(
    (a, b) => (b.completionsCount || 0) - (a.completionsCount || 0)
  )

  return (
    <div className={styles.list_wrap}>
      <div className={styles.summary_hint}>
        Уникальных тренажеров освоено: <strong>{sortedStats.length}</strong>
      </div>

      {sortedStats.map((item, idx) => {
        const count = item.completionsCount || 0
        const avgScore =
          count > 0 ? Math.round((item.totalPoints || 0) / count) : 0

        return (
          <div key={item.alias || idx} className={styles.exercise_card}>
            <div className={styles.card_top}>
              <span className={styles.exercise_title}>
                {item.title || item.alias}
              </span>
              <span className={styles.count_badge}>{count} раз</span>
            </div>

            <div className={styles.card_metrics}>
              <span>
                Лучший балл: <strong>{item.bestScore || 0}</strong>
              </span>
              <span>
                Средний балл: <strong>{avgScore}</strong>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UserExercisesTab
