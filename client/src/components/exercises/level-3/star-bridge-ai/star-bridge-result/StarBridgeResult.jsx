import React from 'react'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './StarBridgeResult.module.css'

const StarBridgeResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.starBridge)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <ScreenSpinner />
        <span className={styles.loading_text}>
          Бизнес-аналитик изучает ваш Elevator Pitch в лифте...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Исход встречи</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Анализ нетворкинга:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Сила зацепки (хук)</span>
              <span>{verdict.criteria?.hook_power || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.hook_power || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Четкость оффера</span>
              <span>{verdict.criteria?.offer_clarity || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.offer_clarity || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Наглость и CTA</span>
              <span>{verdict.criteria?.cta_boldness || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.cta_boldness || 0}%` }} />
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

export default StarBridgeResult
