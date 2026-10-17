import React from 'react'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './ToastCriticResult.module.css'

const ToastCriticResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.toastCritic)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <ScreenSpinner />
        <span className={styles.loading_text}>
          Тамада со стажем и ресторанный критик изучают стенограмму вашего тоста...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Рецензия на тост</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия критика */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Вердикт банкетного критика:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям праздничной риторики */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Соблюдение структуры</span>
              <span>{verdict.criteria?.structure_match || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.structure_match || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Юмор и харизма</span>
              <span>{verdict.criteria?.humor_charisma || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.humor_charisma || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Отсутствие штампов</span>
              <span>{verdict.criteria?.no_cliches || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.no_cliches || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок управления */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Другой инфоповод
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default ToastCriticResult
