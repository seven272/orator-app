import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './AlibiResult.module.css'

// Словарь критериев адаптирован под блок "Убедительность" и детективный сценарий
const dictionary = {
  logic: 'Логика и структура',
  consistency: 'Непротиворечивость фактов',
  confidence: 'Устойчивость под давлением',
}

const AlibiResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict } = useSelector((state) => state.alibi)

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Допрос завершен</h3>

        {/* Общий балл в круге */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация оценок */}
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

        {/* Текстовый вердикт */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Вердикт ИИ-судьи:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Начать заново
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
            <IoMdShare size={15} /> Поделиться результатом
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlibiResult
