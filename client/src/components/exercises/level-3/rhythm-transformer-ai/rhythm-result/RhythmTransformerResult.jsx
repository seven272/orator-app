import React from 'react'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './RhythmTransformerResult.module.css'

const RhythmTransformerResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.rhythmTransformer)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <ScreenSpinner />
        <span className={styles.loading_text}>
          ИИ-логопед детально сканирует звуковые стыки и слоги...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Результат дикционного теста</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Анализ артикуляции:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Чистота звуковых стыков</span>
              <span>{verdict.criteria?.phonetics || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.phonetics || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Удержание темпоритма</span>
              <span>{verdict.criteria?.rhythm_stability || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.rhythm_stability || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Полнота слогов и окончаний</span>
              <span>{verdict.criteria?.syllable_completeness || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.syllable_completeness || 0}%` }} />
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

export default RhythmTransformerResult
