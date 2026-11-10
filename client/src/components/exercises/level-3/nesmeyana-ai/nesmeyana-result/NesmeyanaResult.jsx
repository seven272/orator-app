import React from 'react'
import { useSelector } from 'react-redux'
import Spinner from '../../../../../UI/spinner/Spinner'

import styles from './NesmeyanaResult.module.css'

const NesmeyanaResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.nesmeyana)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <Spinner  />
        <span className={styles.loading_text}>
          ИИ-эксперт изучает стенограмму и вычисляет драматургические паузы выступления...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Реакция Несмеяны</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия ИИ-арбитра */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Вердикт ИИ-эксперта:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по комедийным критериям риторики */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Выразительность и тон</span>
              <span>{verdict.criteria?.expressiveness_tone || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.expressiveness_tone || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Тайминг пауз перед панчлайном</span>
              <span>{verdict.criteria?.timing_pause || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.timing_pause || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Точность текста шутки</span>
              <span>{verdict.criteria?.text_precision || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.text_precision || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок управления */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Другой слушатель
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default NesmeyanaResult
