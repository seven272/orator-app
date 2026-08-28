import React from 'react'
import { FaCoins } from 'react-icons/fa'

import styles from './ExamLocked.module.css'

const ExamLocked = ({
  lockedUntil,
  isSubmitting,
  onUnlockWithCoins,
  error,
}) => {
  return (
    <div className={styles.locked_card}>
      <h2 className={styles.locked_title}>
        🔒 Доступ временно ограничен
      </h2>
      <p className={styles.locked_text}>
        К сожалению, предыдущая попытка оказалась неудачной. Вы
        можете подождать 24 часа для бесплатного сброса таймера блокировки
        или открыть доступ прямо сейчас за 50 монет.
      </p>
      
      {lockedUntil && (
        <div className={styles.time_badge}>
          Авто-разблокировка: {lockedUntil.toLocaleString()}
        </div>
      )}
  <button
        className={styles.buy_button}
        onClick={onUnlockWithCoins}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          'Списание монет...'
        ) : (
          <span className={styles.button_content}>
            <FaCoins className={styles.coin_icon} /> {/* 💡 Вставляем иконку */}
            Разблокировать за 50 монет
          </span>
        )}
      </button>

      {error && <div className={styles.error_alert}>{error}</div>}
    </div>
  )
}

export default ExamLocked
