import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './AlibiIdle.module.css'

const AlibiIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>
      <span className={styles.screen_idle_title}>
        Сменить задание{' '}
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
            {situationData.legend}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Начать допрос
        </button>
      </div>
    </div>
  )
}

export default AlibiIdle
