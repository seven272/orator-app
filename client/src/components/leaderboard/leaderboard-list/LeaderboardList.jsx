import React from 'react'
import styles from './LeaderboardList.module.css'

const LeaderboardList = ({ user, isCurrent, activeTab }) => {
  const isTopThree = user.rank <= 3
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  // Валидация аватара: отсекаем пустые строки, заглушки 'dicebear.com' и строки без расширения файла
  const hasValidAvatar =
    user.avatar &&
    (user.avatar.startsWith('http://') ||
      user.avatar.startsWith('https://') ||
      user.avatar.startsWith('/uploads/'))

  return (
    <div
      className={`
        ${styles.row} 
        ${isCurrent ? styles.rowCurrentUser : ''} 
        ${user.isPremium ? styles.rowPremium : ''}
      `}
    >
      {/* Место в рейтинге (медаль или цифра) */}
      <div
        className={`${styles.rank} ${isTopThree ? styles.rank_medal : ''}`}
      >
        {isTopThree ? medals[user.rank] : user.rank}
      </div>

      {/* Аватар или текстовый фоллбек */}
      {hasValidAvatar ? (
        <img
          src={user.avatar}
          alt={user.displayName}
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarFallback}>
          {user.displayName?.charAt(0).toUpperCase() || 'A'}
        </div>
      )}

      {/* Имя и статус */}
      <div className={styles.nameContainer}>
        <span className={styles.name}>
          {user.displayName || 'Аноним'}
        </span>
        {user.isPremium && (
          <span className={styles.premiumBadge}>PRO</span>
        )}
      </div>

      {/* Очки и уровень */}
      <div className={styles.stats}>
        <span className={styles.score}>
          {user.score?.toLocaleString() || 0}{' '}
          {activeTab === 'weekly' ? 'WXP' : 'XP'}
        </span>
        <span className={styles.level}>{user.level} ур.</span>
      </div>
    </div>
  )
}

export default LeaderboardList
