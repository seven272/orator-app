import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'
import styles from './HistoricalResult.module.css'

// Словарь локализации строго под новые критерии исторического батла
const dictionary = {
  rhetoricalEcho: 'Риторическое эхо',
  contextualForce: 'Сила контекста',
  argumentDensity: 'Плотность аргументов',
}

const HistoricalResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict } = useSelector((state) => state.historical)

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Анализ великой речи завершен</h3>

        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span className={styles.criteria_label}>
                {dictionary[name] || name}: <strong>{value}</strong>
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>Рецензия профессора риторики:</h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Выбрать другую речь
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            Завершить тренажер
          </button>
          <button className={styles.btn_share} onClick={() => console.log('vk share historical')}>
            <IoMdShare size={15} /> Поделиться триумфом
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoricalResult
