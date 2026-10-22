import React from 'react'
import { useSelector } from 'react-redux'
import Spinner from '../../../../../UI/spinner/Spinner'

import styles from './EmpathySparkResult.module.css'

const EmpathySparkResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.empathySpark)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <Spinner />
        <span className={styles.loading_text}>
          ИИ-психолог внимательно анализирует стенограмму поддержки...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Результат сессии эмпатии</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Разбор психолога:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Валидация и принятие чувств</span>
              <span>{verdict.criteria?.validation || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.validation || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Активное слушание</span>
              <span>{verdict.criteria?.active_listening || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.active_listening || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Экологичность влияния</span>
              <span>{verdict.criteria?.influence_safety || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.influence_safety || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Другая ситуация
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default EmpathySparkResult
