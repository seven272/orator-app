import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './IcebreakerIdle.module.css'

const IcebreakerIdle = ({
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
          <strong>Контекст:</strong> {situationData.category}
        </span>
        <span className={styles.idle_text}>
          <strong>Ваша роль:</strong> {situationData.role}
        </span>
        <span className={styles.idle_text}>
          <strong>Ваш собеседник:</strong> {situationData.target}
        </span>
        <span className={styles.idle_text}>
          {situationData.context}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Начать диалог
        </button>
      </div>
    </div>
  )
}

export default IcebreakerIdle
