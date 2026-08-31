import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { fetchLeaderboard } from '../../redux/slices/leaderboardSlice'
import styles from './Leaderboard.module.css'
import LeaderboardList from './leaderboard-list/LeaderboardList'

const Leaderboard = () => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('global') // 'global' | 'weekly'
  const {
    weeklyList,
    globalList,
    weeklyCurrentUser,
    globalCurrentUser,
    status,
  } = useSelector((state) => state.leaderboard)

  // Динамически определяем, какой массив и какого юзера рендерить прямо сейчас
  const list = activeTab === 'weekly' ? weeklyList : globalList
  const currentUser =
    activeTab === 'weekly' ? weeklyCurrentUser : globalCurrentUser

  const isUserInTopTen = currentUser?.id
    ? list.some((u) => u.id === currentUser.id)
    : true // Если юзер гость, скрываем нижнюю личную карточку автоматическим true
    
  useEffect(() => {
    dispatch(fetchLeaderboard(activeTab))
  }, [dispatch, activeTab])

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Рейтинг ораторов</h2>

      {/* Переключатель вкладок */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'global' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('global')}
        >
          За всё время
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'weekly' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('weekly')}
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
                activeTab={activeTab}
              />
            ))}
          </div>

          {/* Карточка текущего пользователя, если он не попал в ТОП-10 */}
          {!isUserInTopTen && currentUser && (
            <>
              <div className={styles.user_divider}>
                {activeTab === 'weekly'
                  ? 'Ваш результат за неделю'
                  : 'Ваш глобальный результат'}
              </div>
              <div className={styles.currentUserStickyWrapper}>
                <LeaderboardList
                  user={currentUser}
                  isCurrent={true}
                  activeTab={activeTab}
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
