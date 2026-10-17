import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './ToastCriticIdle.module.css'

const ToastCriticIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить структуру тостов
      </button>

      <span className={styles.screen_idle_title}>
        Сменить инфоповод{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Событие:</strong> {situationData.event}
        </span>
        
        {/* Контейнер обязательной схемы тоста */}
        <div className={styles.concepts_wrapper}>
          <div className={styles.concept_item}>
            <span className={styles.concept_label}>Обязательная композиция</span>
            <span className={styles.concept_name}>{situationData.schema}</span>
          </div>
        </div>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Взять микрофон
        </button>
      </div>
    </div>
  )
}

export default ToastCriticIdle
