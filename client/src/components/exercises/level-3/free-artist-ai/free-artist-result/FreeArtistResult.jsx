import React from 'react'
import { useSelector } from 'react-redux'
import Spinner from '../../../../../UI/spinner/Spinner'

import styles from './FreeArtistResult.module.css'

const FreeArtistResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict, exStatus } = useSelector((state) => state.freeArtist)

  if (exStatus === 'loading' || !verdict) {
    return (
      <div className={styles.loading_box}>
        <Spinner  />
        <span className={styles.loading_text}>
          ИИ-эксперт по риторике проводит глубокий экспертный разбор вашего монолога...
        </span>
      </div>
    )
  }

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Анализ вашего выступления</h3>
        
        {/* Круговой балл */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Блок вердикта / Рецензия ИИ-эксперта */}
        <div className={styles.verdict_box}>
          <div className={styles.verdict_subtitle}>Рецензия ИИ-эксперта:</div>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Разбор по профессиональным ораторским критериям */}
        <div className={styles.criteria_list}>
          
          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Логика и структура</span>
              <span>{verdict.criteria?.logic_structure || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.logic_structure || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Убедительность и богатство языка</span>
              <span>{verdict.criteria?.persuasiveness_vocabulary || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.persuasiveness_vocabulary || 0}%` }} />
            </div>
          </div>

          <div className={styles.criteria_item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Чистота речи (без паразитов)</span>
              <span>{verdict.criteria?.speech_clarity || 0}/100</span>
            </div>
            <div className={styles.mini_bar}>
              <div style={{ width: `${verdict.criteria?.speech_clarity || 0}%` }} />
            </div>
          </div>

        </div>

        {/* Группа кнопок управления */}
        <div className={styles.btn_group}>
          <button className={styles.btn_restart} onClick={onRestartExercise}>
            Новое выступление
          </button>
          <button className={styles.btn_close} onClick={onCloseExercise}>
            В меню тренажеров
          </button>
        </div>

      </div>
    </div>
  )
}

export default FreeArtistResult
