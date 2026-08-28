import React from 'react'
import { AiFillRobot } from "react-icons/ai";
import styles from './LiveDuelAiOffer.module.css'         

const LiveDuelAiOffer = ({ onAccept, onBack, loading }) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar_wrapper}>
          <div className={styles.avatar_core}><AiFillRobot size={30} className={styles.icon_ai} /></div>
          <div className={styles.pulse_ring}></div>
        </div>

        <h2 className={styles.title}>Собеседник не подключился 😢</h2>
        <p className={styles.hint}>
          Время ожидания вышло. Чтобы не терять время, вы можете провести
          тренировочный баттл с нашим продвинутым ИИ-экспертом.
        </p>

        <div className={styles.premium_tag}>Требуется Premium подписка</div>

        <div className={styles.action_buttons}>
          <button
            className={`${styles.action_btn} ${styles.btn_primary}`}
            onClick={onAccept}
            disabled={loading}
          >
            {loading ? 'Запуск системы...' : 'Сразиться с ИИ ⚔️'}
          </button>
          <button
            className={`${styles.action_btn} ${styles.btn_secondary}`}
            onClick={onBack}
            disabled={loading}
          >
            Выйти в меню
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiveDuelAiOffer
