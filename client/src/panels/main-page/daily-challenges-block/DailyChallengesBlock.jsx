import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { All_EXERCISES } from '../../../assets/mocks/exercises'
import styles from './DailyChallengesBlock.module.css'
// import { fetchDailyTasks } from '../../../redux/slices/dailySlice'

const DailyChallengesBlock = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { tasks = [] } = useSelector((state) => state.daily || {})
  // Берем только 1 невыполненно задания дня
  const task = tasks[0] || {}
  const {
    alias,
    title,
    description,
    reward,
    goal,
    currentValue,
    isCompleted,
    locked,
  } = task

  // Загружаем задачи при монтировании
  // useEffect(() => {
  //   dispatch(fetchDailyTasks())
  // }, [dispatch])

  // Находим иконку из статического конфига по alias
  const exerciseConfig = Object.values(All_EXERCISES)
    .flat()
    .find((ex) => ex.alias === alias)

  const iconSrc = exerciseConfig?.icon

  return (
    <section className={styles.challenges_section}>
      <h2 className={styles.section_title}>🔥 ЗАДАНИЯ ДНЯ</h2>

      <div
        className={styles.card}
        onClick={() => navigate('/exercises-daily')}
      >
        <div className={styles.content_wrap}>
          <div className={styles.icon_wrapper}>
            <img src={iconSrc} alt={title} className={styles.icon} />
          </div>

          <div className={styles.content}>
            <span className={styles.task_title}>{title}</span>
            <span className={styles.description}>{description}</span>
          </div>

          <div className={styles.side_info}>
            <span className={styles.reward}>+{reward} XP</span>
            <span className={styles.progress_label}>
              {currentValue}/{goal}
            </span>
          </div>
        </div>
        <div className={styles.banner_footer}>
          <span>Нажми, чтобы посмотреть все 3 задания</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default DailyChallengesBlock
