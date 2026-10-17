import React from 'react'
import { useSelector } from 'react-redux'
import { Spinner } from '@vkontakte/vkui'

import styles from './JargonResult.module.css'

const JargonResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.jargonBoss)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <Spinner />
        <span className={styles.loading_text}>
          Авторитетные эксперты слушают кассету с записью...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Исход разборки</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Рецензия авторитетов:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Соблюдение понятий (жаргон)</span>
              <span>{verdict.criteria?.context_match || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.context_match || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Уверенность подачи</span>
              <span>{verdict.criteria?.voice_firmness || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.voice_firmness || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ударный финал</span>
              <span>{verdict.criteria?.final_punch || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.final_punch || 0}%` }} />
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

export default JargonResult
