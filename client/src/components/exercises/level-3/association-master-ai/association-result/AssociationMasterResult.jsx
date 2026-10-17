import React from 'react'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './AssociationMasterResult.module.css'

const AssociationMasterResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.associationMaster)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <ScreenSpinner />
        <span className={styles.loading_text}>
          Профессиональный лингвист анализирует изящество вашей речи...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Анализ риторики</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия лингвиста */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Рецензия критика-лингвиста:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по критериям риторики */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Оригинальность цепочки</span>
              <span>{verdict.criteria?.originality_score || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.originality_score || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Красота метафор</span>
              <span>{verdict.criteria?.metaphor_beauty || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.metaphor_beauty || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Логика перехода</span>
              <span>{verdict.criteria?.logic_bridge || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.logic_bridge || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок управления */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Другие понятия
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default AssociationMasterResult
