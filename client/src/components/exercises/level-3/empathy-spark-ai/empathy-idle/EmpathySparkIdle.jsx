import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './EmpathySparkIdle.module.css'

const EmpathySparkIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией эмпатии
      </button>

      <span className={styles.screen_idle_title}>
        Сменить ситуацию{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Происшествие:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Что случилось:</strong> {situationData.event}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Начать сессию поддержки
        </button>
      </div>
    </div>
  )
}

export default EmpathySparkIdle
