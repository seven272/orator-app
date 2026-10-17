import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './PitchIdle.module.css'

const PitchIdle = ({
  onRefreshTopic,
  onShowTheory,
  subjectData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить теорию питчинга
      </button>

      <span className={styles.screen_idle_title}>
        Сменить предмет стартапа{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Предмет для продажи:</strong> {subjectData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Бизнес-легенда:</strong> {subjectData.legend}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!subjectData}
        >
          Войти в кабинет инвестора
        </button>
      </div>
    </div>
  )
}

export default PitchIdle
