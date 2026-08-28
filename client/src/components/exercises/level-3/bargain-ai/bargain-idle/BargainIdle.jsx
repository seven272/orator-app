import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './BargainIdle.module.css'

const BargainIdle = ({
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
        Сменить сценарий{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>
      
      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Ситуация:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Предмет торга:</strong> {situationData.item}
        </span>
        <span className={styles.idle_text}>
          <strong>Начальная цена:</strong> {Number(situationData.initial_price).toLocaleString()} ₽
        </span>
        <span className={styles.idle_text}>
          <strong>Позиция продавца:</strong> {situationData.seller_focus}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Начать переговоры
        </button>
      </div>
    </div>
  )
}

export default BargainIdle

