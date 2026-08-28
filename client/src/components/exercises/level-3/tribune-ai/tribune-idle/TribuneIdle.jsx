import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './TribuneIdle.module.css'

const TribuneIdle = ({
  onRefreshTopic,
  onShowTheory,
  tribuneData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>
      <span className={styles.screen_idle_title}>{tribuneData.topic}   <GrUpdate
            size={15}
            className={styles.change_topic_icon}
            onClick={onRefreshTopic}
          /></span>
      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          {tribuneData.task}
        </span>
        <span className={styles.idle_text}>
         {tribuneData.context}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!tribuneData}
        >
          Приступить
        </button>
      </div>
    </div>
  )
}

export default TribuneIdle
