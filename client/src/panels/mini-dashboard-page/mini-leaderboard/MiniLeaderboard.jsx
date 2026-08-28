import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchLeaderboard } from '../../../redux/slices/leaderboardSlice'
import { FaCrown, FaChevronRight } from 'react-icons/fa'
import styles from './MiniLeaderboard.module.css'

const MiniLeaderboard = () => {
  const dispatch = useDispatch()
   const navigate = useNavigate()

  const {
    list: leaderboardList,
    currentUser,
    status,
  } = useSelector((state) => state.leaderboard)
  const { user: profileUser } = useSelector((state) => state.profile)

  useEffect(() => {
    if (!leaderboardList || leaderboardList.length === 0) {
      dispatch(fetchLeaderboard('global'))
    }
  }, [dispatch, leaderboardList])

  const getSlicedList = () => {
    if (!leaderboardList || leaderboardList.length === 0) return []

    const currentUserId = currentUser?.id || profileUser?.id
    const userIndex = leaderboardList.findIndex(
      (u) => u.id === currentUserId,
    )

    if (userIndex <= 2) {
      return leaderboardList.slice(0, 3)
    }

    return leaderboardList.slice(userIndex - 1, userIndex + 2)
  }

  const slicedList = getSlicedList()
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className={styles.card}>
      {/* Шапка блока */}
      <div className={styles.leaderboard_header}>
        <div className={styles.leaderboard_title}>
          <FaCrown className={styles.icon_crown} />
          <span>Рейтинг ораторов</span>
        </div>
      </div>

      {status === 'loading' ? (
        <div className={styles.inner_loading}>
          Загрузка рейтинга...
        </div>
      ) : (
        <div className={styles.leaderboard_mini_list}>
          {slicedList.map((userItem) => {
            const isTopThree = userItem.rank <= 3
            const isCurrent =
              userItem.id === (currentUser?.id || profileUser?.id)
            const hasValidAvatar =
              userItem.avatar && userItem.avatar.includes('https')

            return (
              <div
                key={userItem.id}
                className={`
                  ${styles.leaderboard_row} 
                  ${isCurrent ? styles.row_current : ''} 
                  ${userItem.isPremium ? styles.row_premium : ''}
                `}
              >
                <span className={styles.user_rank}>
                  {isTopThree
                    ? medals[userItem.rank]
                    : `#${userItem.rank}`}
                </span>

                {hasValidAvatar ? (
                  <img
                    src={userItem.avatar}
                    alt={userItem.displayName}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatar_fallback}>
                    {userItem.displayName?.charAt(0).toUpperCase() ||
                      'A'}
                  </div>
                )}

                <div className={styles.name_container}>
                  <span className={styles.user_name}>
                    {userItem.displayName || 'Аноним'}
                  </span>
                  {userItem.isPremium && (
                    <span className={styles.premium_badge}>PRO</span>
                  )}
                </div>

                <span className={styles.user_points}>
                  {userItem.score?.toLocaleString() || 0} XP
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Кнопка перехода на полный экран лидерборда */}
      <button
        type="button"
        className={styles.more_btn}
        onClick={() => navigate('/leaderboard')}
      >
        <span>Весь рейтинг</span>
        <FaChevronRight className={styles.icon_arrow} />
      </button>
    </div>
  )
}

export default MiniLeaderboard
