import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchLeaderboard } from '../../../../../redux/slices/leaderboardSlice'
import { FaCrown, FaChevronRight } from 'react-icons/fa'
import styles from './MiniLeaderboard.module.css'

const MiniLeaderboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Достаем данные из нового состояния слайса рейтинга
  const {
    globalList,
    globalCurrentUser,
    status,
  } = useSelector((state) => state.leaderboard)
  
  // Подтягиваем данные из профиля как запасной вариант (fallback)
  const profileUser = useSelector((state) => state.profile.user)

  useEffect(() => {
    if (!globalList || globalList.length === 0) {
      dispatch(fetchLeaderboard('global'))
    }
  }, [dispatch, globalList])

  // Определяем позицию, имя и аватар текущего пользователя
  const rankNumber = globalCurrentUser?.rank || profileUser?.progression?.level ? 'В рейтинге' : '#—'
  const userRank = globalCurrentUser?.rank ? `#${globalCurrentUser.rank}` : rankNumber
  const userScore = globalCurrentUser?.score || profileUser?.xp || 0
  const isPremium = profileUser?.isPremium || globalCurrentUser?.isPremium || false

  const displayName = profileUser?.displayName || globalCurrentUser?.displayName || 'Аноним'
  const avatar = profileUser?.avatar || globalCurrentUser?.avatar
  const hasValidAvatar = avatar && avatar.includes('http')

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const displayRank = globalCurrentUser?.rank && medals[globalCurrentUser.rank] 
    ? medals[globalCurrentUser.rank] 
    : userRank

  return (
    <div className={styles.leaderboard_wrapper}>
      {/* Шапка блока */}
      <div className={styles.leaderboard_header}>
        <div className={styles.leaderboard_title}>
          <FaCrown className={styles.icon_crown} />
          <span>Ваше место в рейтинге</span>
        </div>
      </div>

      {status === 'loading' ? (
        <div className={styles.inner_loading}>
          Загрузка вашей позиции...
        </div>
      ) : (
        <div className={styles.leaderboard_mini_list}>
          {/* Отображаем строго одну карточку текущего пользователя */}
          <div
            className={`
              ${styles.leaderboard_row} 
              ${styles.row_current} 
              ${isPremium ? styles.row_premium : ''}
            `}
          >
            <span className={styles.user_rank}>
              {displayRank}
            </span>

            {hasValidAvatar ? (
              <img
                src={avatar}
                alt={displayName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatar_fallback}>
                {displayName.charAt(0).toUpperCase() || 'А'}
              </div>
            )}

            <div className={styles.name_container}>
              <span className={styles.user_name}>
                {displayName} (Вы)
              </span>
              {isPremium && (
                <span className={styles.premium_badge}>PRO</span>
              )}
            </div>

            <span className={styles.user_points}>
              {userScore.toLocaleString()} XP
            </span>
          </div>
        </div>
      )}

      {/* Кнопка перехода на полный экран лидерборда */}
      <button
        type="button"
        className={styles.more_btn}
        onClick={() => navigate('/leaderboard')}
      >
        <span>Смотреть весь рейтинг</span>
        <FaChevronRight className={styles.icon_arrow} />
      </button>
    </div>
  )
}

export default MiniLeaderboard
