import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './MetaphorResult.module.css'

// Словарь критериев адаптирован под ораторское мастерство и находчивость
const dictionary = {
  accuracy: 'Точность метафоры',
  simplicity: 'Простота языка',
  adaptability: 'Адаптивность и гибкость',
}

const MetaphorResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict } = useSelector((state) => state.metaphor)

  if (!verdict) return <ScreenSpinner />
  
  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Объяснение завершено</h3>

        {/* Общий балл за находчивость */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация лингвистических критериев */}
        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span>
                {dictionary[name] || name}: {value}
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Текстовый фидбек от лингвистического эксперта */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Резюме эксперта по коммуникациям:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>
        
        {/* Кнопки управления */}
        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Попробовать снова
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
            <IoMdShare size={15} /> Поделиться метафорой
          </button>
        </div>
      </div>
    </div>
  )
}

export default MetaphorResult
