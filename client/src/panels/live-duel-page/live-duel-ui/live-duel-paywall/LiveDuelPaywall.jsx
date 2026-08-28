import React from 'react'

import styles from './LiveDuelPaywall.module.css'   

const LiveDuelPaywall = ({ onSubscribe, onBack }) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.crown}>⭐</div>
        <h2 className={styles.title}>Доступно только с Premium</h2>
        <p className={styles.hint}>
          Функция тренировок и интерактивных баттлов с искусственным
          интеллектом доступна исключительно для Premium-пользователей.
        </p>
        <div className={styles.action_buttons}>
          <button
            className={`${styles.action_btn} ${styles.btn_gold}`}
            onClick={onSubscribe}
          >
            Активировать Premium слоты
          </button>
          <button
            className={`${styles.action_btn} ${styles.btn_text}`}
            onClick={onBack}
          >
            Назад к предложению
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiveDuelPaywall
