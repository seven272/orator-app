import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCheckSquare } from 'react-icons/fa'

import { All_EXERCISES } from '../../../assets/mocks/exercises'
import styles from './DailyTaskCard.module.css'

const DailyTaskCard = ({ task }) => {
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
 const navigate = useNavigate()

  // Находим иконку из статического конфига по alias
  const exerciseConfig = Object.values(All_EXERCISES)
    .flat()
    .find((ex) => ex.alias === alias)

  const iconSrc = exerciseConfig?.icon

  const handleClick = () => {
    if (locked) {
      console.log('Доступно только в Premium')
      return
    }
    if (isCompleted) {
      console.log('Задание уже выполнено')
      return
    }

  
    navigate(`/exercise/${alias}?daily=true`)
  }

  // Динамические классы собраны через удобный массив в snake_case
  const cardClasses = [
    styles.card,
    locked ? styles.locked : '',
    isCompleted ? styles.completed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Бейдж для премиум-задач */}
      {locked && <div className={styles.premium_badge}>Premium</div>}

      <div className={styles.icon_wrapper}>
        <img src={iconSrc} alt={title} className={styles.icon} />
      </div>

      <div className={styles.content}>
        <span className={styles.task_title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </div>

      <div className={styles.side_info}>
        <span className={styles.reward}>+{reward} XP</span>

        {isCompleted ? (
          <span className={styles.check_icon}>
            <FaCheckSquare size={20} /> выполнено
          </span>
        ) : (
          !locked && (
            <span className={styles.progress_label}>
              {currentValue}/{goal}
            </span>
          )
        )}
      </div>
    </div>
  )
}

export default DailyTaskCard
