import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './StarBridgeIdle.module.css'

const StarBridgeIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить правила Elevator Pitch
      </button>

      <span className={styles.screen_idle_title}>
        Сменить кумира{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Место встречи:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Контекст:</strong> {situationData.event}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Зайти в лифт
        </button>
      </div>
    </div>
  )
}

export default StarBridgeIdle
