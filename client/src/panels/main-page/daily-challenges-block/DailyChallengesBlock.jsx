import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { All_EXERCISES } from '../../../assets/mocks/exercises'
import styles from './DailyChallengesBlock.module.css'

const DailyChallengesBlock = () => {
  const navigate = useNavigate()
  const { tasks = [], isDemo } = useSelector((state) => state.daily || {})
  
  // Берем первое доступное задание из списка
  const task = tasks[0] || {}
  const { alias, title, description, reward, goal, currentValue } = task

  // Ищем иконку в статичном конфиге
  const exerciseConfig = Object.values(All_EXERCISES)
    .flat()
    .find((ex) => ex.alias === alias)
  const iconSrc = exerciseConfig?.icon

  const handleCardClick = () => {
    if (isDemo) {
      navigate('/exercises-daily') // Гостя шлём на регистрацию
    } else {
      navigate('/exercises-daily') // Авторизованного — на страницу списка его задач
    }
  }

  return (
    <section className={styles.challenges_section}>
      <h2 className={styles.section_title}>🔥 ЗАДАНИЯ ДНЯ</h2>

      <div
        className={`${styles.card} ${isDemo ? styles.guest_card : ''}`}
        onClick={handleCardClick}
      >
        <div className={styles.content_wrap}>
          <div className={styles.icon_wrapper}>
            {iconSrc && <img src={iconSrc} alt={title} className={styles.icon} />}
          </div>

          <div className={styles.content}>
            <span className={styles.task_title}>{title}</span>
            <span className={styles.description}>
              {isDemo ? 'Войди в аккаунт, чтобы активировать квест и забрать XP' : description}
            </span>
          </div>

          <div className={styles.side_info}>
            <span className={styles.reward}>+{reward} XP</span>
            <span className={styles.progress_label}>
              {isDemo ? '🔒' : `${currentValue}/${goal}`}
            </span>
          </div>
        </div>
        <div className={styles.banner_footer}>
          <span>{isDemo ? 'Доступно 3 новых задания ежедневно' : 'Нажми, чтобы посмотреть все 3 задания'}</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default DailyChallengesBlock
