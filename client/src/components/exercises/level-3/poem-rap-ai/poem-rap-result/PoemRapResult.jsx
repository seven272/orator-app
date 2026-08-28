import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './PoemRapResult.module.css'

// Специализированный словарь локализации для музыкального рэп-жюри
const dictionary = {
  rhythm: 'Ритмика',
  articulation: 'Четкость слогов',
  drive: 'Драйв',
}

const PoemRapResult = ({ onCloseExercise, onRestartExercise }) => {
  // Вытаскиваем вердикт из Redux-состояния рэп-манифеста
  const { verdict } = useSelector((state) => state.poemRap)

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Трек записан</h3>

        {/* Общий балл в круге */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация оценок по флоу */}
        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span>
                {dictionary[name] || name}: {value}%
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Вердикт ИИ-продюсера */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Рецензия ИИ-продюсера:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Навигационные кнопки управления */}
        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Записать еще дубль
          </button>
          <button
            className={styles.btn_close}
            onClick={onCloseExercise}
          >
            Завершить упражнение
          </button>

          <button
            className={styles.btn_share}
            onClick={() => console.log('vk share')}
          >
            <IoMdShare size={15} /> Поделиться треком
          </button>
        </div>
      </div>
    </div>
  )
}

export default PoemRapResult
