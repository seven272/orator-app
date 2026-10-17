import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './AntiFlatteryIdle.module.css'

const AntiFlatteryIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить приемы защиты границ
      </button>

      <span className={styles.screen_idle_title}>
        Сменить манипулятора{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Ситуация:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Суть давления:</strong> {situationData.event}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Принять переговоры
        </button>
      </div>
    </div>
  )
}

export default AntiFlatteryIdle
