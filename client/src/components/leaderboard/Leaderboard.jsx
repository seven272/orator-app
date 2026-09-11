import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { fetchLeaderboard } from '../../redux/slices/leaderboardSlice'
import styles from './Leaderboard.module.css'
import LeaderboardList from './leaderboard-list/LeaderboardList'

const Leaderboard = () => {
  const dispatch = useDispatch()
  // Оставляем только внутренний подфильтр времени
  const [timeFilter, setTimeFilter] = useState('global') // 'global' | 'weekly'

  const {
    weeklyList,
    globalList,
    weeklyCurrentUser,
    globalCurrentUser,
    status,
  } = useSelector((state) => state.leaderboard)

  const list = timeFilter === 'weekly' ? weeklyList : globalList
  const currentUser =
    timeFilter === 'weekly' ? weeklyCurrentUser : globalCurrentUser

  const isUserInTopTen = currentUser?.id
    ? list.some((u) => u.id === currentUser.id)
    : true
    
  useEffect(() => {
    dispatch(fetchLeaderboard(timeFilter))
  }, [dispatch, timeFilter])

  return (
    <div className={styles.container}>
      {/* Возвращаем чистый заголовок */}
      <h2 className={styles.title}>Рейтинг ораторов</h2>

      {/* Компактный переключатель времени внутри рейтинга */}
      <div className={styles.timeSubFilters}>
        <button 
          className={`${styles.subFilterBtn} ${timeFilter === 'global' ? styles.subFilterActive : ''}`}
          onClick={() => setTimeFilter('global')}
        >
          За всё время
        </button>
        <span className={styles.subFilterDivider}>|</span>
        <button 
          className={`${styles.subFilterBtn} ${timeFilter === 'weekly' ? styles.subFilterActive : ''}`}
          onClick={() => setTimeFilter('weekly')}
        >
          За неделю
        </button>
      </div>

      {status === 'loading' ? (
        <div className={styles.loader}>
          Загрузка таблицы лидеров...
        </div>
      ) : (
        <>
          {/* Главный список ТОП-10 */}
          <div className={styles.list}>
            {list.map((user) => (
              <LeaderboardList
                key={user.id}
                user={user}
                isCurrent={user.id === currentUser?.id}
                activeTab={timeFilter}
              />
            ))}
          </div>

          {/* Карточные результаты текущего пользователя вне ТОП-10 */}
          {!isUserInTopTen && currentUser && (
            <>
              <div className={styles.user_divider}>
                {timeFilter === 'weekly'
                  ? 'Ваш результат за неделю'
                  : 'Ваш глобальный результат'}
              </div>
              <div className={styles.currentUserStickyWrapper}>
                <LeaderboardList
                  user={currentUser}
                  isCurrent={true}
                  activeTab={timeFilter}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Leaderboard
