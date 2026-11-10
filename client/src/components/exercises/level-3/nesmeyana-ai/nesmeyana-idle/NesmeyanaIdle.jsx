import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './NesmeyanaIdle.module.css'

const NesmeyanaIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить комедийную подачу
      </button>

      <span className={styles.screen_idle_title}>
        Сменить слушателя{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}> 
          <strong>Слушатель:</strong> {situationData.character}
        </span>
        <span className={styles.idle_text}> 
          <strong>Обстановка:</strong> {situationData.context}
        </span>
        
        <div className={styles.joke_preview_box}>
          <span className={styles.joke_preview_title}>Текст анекдота для чтения:</span>
          <p className={styles.joke_preview_text}>{situationData.joke_body}</p>
        </div>

        <div className={styles.concepts_wrapper}>
          <div className={styles.concept_item}>
            <span className={styles.concept_label}>Фокус внимания ИИ</span>
            <span className={styles.concept_name}>{situationData.criteria_focus}</span>
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

export default NesmeyanaIdle
