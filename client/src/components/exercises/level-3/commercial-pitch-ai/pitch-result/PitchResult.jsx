import React from 'react'
import { useSelector } from 'react-redux'
import Spinner from '../../../../../UI/spinner/Spinner'

import styles from './PitchResult.module.css'

const PitchResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.commercialPitch)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <Spinner />
        <span className={styles.loading_text}>
          Венчурный комитет изучает презентацию и юнит-экономику стартапа...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Решение инвестора</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Рецензия Эдуарда:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Попадание в боль клиента</span>
              <span>{verdict.criteria?.pain_match || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.pain_match || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Уникальность предложения (УТП)</span>
              <span>{verdict.criteria?.usp_clarity || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.usp_clarity || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Призыв и структура (CTA)</span>
              <span>{verdict.criteria?.cta_structure || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.cta_structure || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Другой предмет
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default PitchResult
