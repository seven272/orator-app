import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './DebateIdle.module.css'

const DebateIdle = ({
  onRefreshTopic,
  onShowTheory,
  topicData,
  userPosition,
  onPositionSelect,
  onStartDebate,
}) => {
 
  return (
    <div className={styles.screen_idle}>
      {/* <span className={styles.screen_idle_title}>Настройка</span> */}
      <button
        className={styles.btn_theory}
        onClick={onShowTheory}
      >
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      <div className={styles.idle_box}>
        <span className={styles.idle_subtitle}>
          Тема{' '}
          <GrUpdate
            size={15}
            className={styles.change_topic_icon}
            onClick={onRefreshTopic}
          />
        </span>
        <span className={styles.idle_topic}>{topicData.topic}</span>
      </div>

      <div className={styles.idle_box}>
        <span className={styles.idle_subtitle}>
          Определите позицию
        </span>
        <div className={styles.pos_btns}>
          <button
            className={`${styles.pos_btn} ${userPosition === topicData.position[0] ? styles.active : ''}`}
            onClick={() => onPositionSelect(topicData.position[0])}
          >
            {topicData.position[0]}
          </button>
          <button
            className={`${styles.pos_btn} ${userPosition === topicData.position[1] ? styles.active : ''}`}
            onClick={() => onPositionSelect(topicData.position[1])}
          >
            {topicData.position[1]}
          </button>
        </div>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStartDebate}
          disabled={!topicData || !userPosition}
        >
          К дебатам
        </button>
      </div>
    </div>
  )
}

export default DebateIdle
