import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './RhythmTransformerIdle.module.css'

const RhythmTransformerIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить основы артикуляции
      </button>

      <span className={styles.screen_idle_title}>
        Сменить скороговорку{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Упражнение:</strong> {situationData.title}
        </span>
        <span className={styles.idle_text}>
          <strong>Суть модификации:</strong> {situationData.situation}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Запустить метроном
        </button>
      </div>
    </div>
  )
}

export default RhythmTransformerIdle
