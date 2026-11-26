/* eslint-disable react/prop-types */
import React from 'react'
import styles from './RankStagePreview.module.css'

const RankStagePreview = ({ stage, serverState, onClose }) => {
  if (!stage) return null

  const isCurrent = serverState?.isCurrent
  const isReached = serverState?.isReached

  return (
    <div className={styles.preview_card}>
      <div className={styles.preview_left}>
        <img
          src={stage.icon}
          alt={stage.title}
          className={styles.preview_png}
        />
        <div className={styles.preview_texts}>
          <div className={styles.preview_top}>
            <strong className={styles.preview_title}>{stage.title}</strong>
            <span
              className={`${styles.preview_status} ${isCurrent ? styles.status_current : isReached ? styles.status_done : styles.status_future}`}
            >
              {isCurrent
                ? 'Ваш текущий уровень'
                : isReached
                  ? 'Этап пройден ✓'
                  : `Порог: ${stage.minXp.toLocaleString()} XP`}
            </span>
          </div>
          <span className={styles.preview_venue}>
            📍 Площадка: {stage.audience}
          </span>
          <p className={styles.preview_desc}>{stage.desc}</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.preview_close_btn}
        onClick={onClose}
        aria-label="Закрыть предпросмотр"
      >
        ✕
      </button>
    </div>
  )
}

export default RankStagePreview
