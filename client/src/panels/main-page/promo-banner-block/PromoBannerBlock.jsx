import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { All_EXERCISES } from '../../../assets/mocks/exercises' // Проверьте путь до файла с моками
import styles from './PromoBannerBlock.module.css'
import birdImage from '../../../assets/images/design/3d_bird.png'

const PromoBannerBlock = () => {
  const navigate = useNavigate()

  // 🎲 Выбираем случайное упражнение строго из массива первого уровня
  const randomExercise = useMemo(() => {
    const level1Exercises = All_EXERCISES?.level1 || []
    if (level1Exercises.length === 0) return null

    const randomIndex = Math.floor(
      Math.random() * level1Exercises.length,
    )
    return level1Exercises[randomIndex]
  }, [])

  // Если вдруг массив пустой, не ломаем верстку
  if (!randomExercise) return null

  const { alias, title, description, icon, skill } = randomExercise

  const handleStartExercise = () => {
    if (alias) {
      navigate(`/exercise/${alias}`)
    }
  }

  return (
    <section
      className={styles.banner_card}
      onClick={handleStartExercise}
      role="button"
      tabIndex={0}
    >
      {/* Левая содержательная часть */}
      <div className={styles.content_side} id="click">
        <div className={styles.tag_row}>
          <span className={styles.tag}>
            ⚡ ГОВОРИКС РЕКОМЕНДУЕТ&nbsp;•
            {skill && (
              <span className={styles.skill_highlight}>
                {' '}
                ПРОКАЧКА: {skill.toUpperCase()}
              </span>
            )}
          </span>
        </div>

        <div className={styles.exercise_row}>
          {icon && (
            <img src={icon} alt="" className={styles.exercise_icon} />
          )}
          <h3 className={styles.title}>{title}</h3>
        </div>

        <p className={styles.description}>{description}</p>

        <div className={styles.action_link}>
          Начать практику <span className={styles.arrow}>→</span>
        </div>
      </div>

      {/* Правая иллюстративная часть с птичкой в углу */}
      <div className={styles.image_side}>
        <img
          src={birdImage}
          alt="GovoriX Mascot"
          className={styles.mascot_img}
        />
      </div>
    </section>
  )
}

export default PromoBannerBlock
