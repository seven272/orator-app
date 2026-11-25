import React from 'react'
import styles from './LeaderboardList.module.css'

const LeaderboardList = ({ user, isCurrent, activeTab }) => {
  const isTopThree = user.rank <= 3
  const isLegend = user.speakerRank === 4
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
        ${isLegend ? styles.rowLegend : ''}
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

      {/* Имя, статус PRO и текстовый ранг оратора */}
      <div className={styles.nameContainer}>
        <div className={styles.nameRow}>
          <span className={styles.name}>
            {user.displayName || 'Аноним'}
          </span>
          {user.isPremium && (
            <span className={styles.premiumBadge}>PRO</span>
          )}
        </div>

        {user.speakerRankTitle && (
          <span
            className={`${styles.speakerRank} ${isLegend ? styles.speakerRankLegend : ''}`}
          >
            {user.speakerRankTitle}
          </span>
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
