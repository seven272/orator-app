import React from 'react'

import styles from './LiveRoomRewardModal.module.css'

const LiveRoomRewardModal = ({data, onClose}) => {
  return (
    <div className={styles.modal_overlay}>
      <div className={styles.modal_content}>
        <div className={styles.modal_header}>
          <h2>Дуэль успешно завершена! 🎉</h2>
          <p className={styles.modal_subtitle}>
            Вы поставили оппоненту {data.rating} из 5 баллов
          </p>
        </div>

        <div className={styles.rewards_list}>
          <div className={styles.reward_item}>
            <span className={styles.reward_icon}>✨</span>
            <span className={styles.reward_text}>
              +{data.earnedXp} XP{' '}
              <small>(с учетом стрика)</small>
            </span>
          </div>
          <div className={styles.reward_item}>
            <span className={styles.reward_icon}>🪙</span>
            <span className={styles.reward_text}>
              +{data.earnedCoins} монет
            </span>
          </div>
        </div>

        {/* Блок повышения уровня */}
        {data.isLevelUp && (
          <div className={styles.level_up_badge}>
            <span className={styles.level_icon}>🚀</span>
            <div>
              <h4>ПОВЫШЕНИЕ УРОВНЯ!</h4>
              <p>
                Ваш новый статус:{' '}
                <strong>Оратор {data.newLevel} уровня</strong>
              </p>
            </div>
          </div>
        )}

        {/* Блок новых ачивок (включая нашу новую за Первую Дуэль) */}
        {data.achievements.length > 0 && (
          <div className={styles.achievements_block}>
            <h3>🏆 Получено достижение:</h3>
            {data.achievements.map((ach, idx) => (
              <div key={idx} className={styles.achievement_badge}>
                <span className={styles.ach_star}>⭐</span>
                <span className={styles.ach_title}>
                  {ach.title || ach}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          className={styles.modal_close_btn}
          onClick={onClose}
        >
          Отлично
        </button>
      </div>
    </div>
  )
}

export default LiveRoomRewardModal
