import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './InterviewIdle.module.css'

const InterviewIdle = ({
  onRefreshTopic,
  onShowTheory,
  interviewData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>
      <span className={styles.screen_idle_title}>{interviewData.topic}   <GrUpdate
            size={15}
            className={styles.change_topic_icon}
            onClick={onRefreshTopic}
          /></span>
      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Ваша роль:</strong> {interviewData.role}
        </span>
        <span className={styles.idle_text}>
         {interviewData.context}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!interviewData}
        >
          Начать интервью
        </button>
      </div>
    </div>
  )
}

export default InterviewIdle
