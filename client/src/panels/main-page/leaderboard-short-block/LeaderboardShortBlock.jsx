import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { fetchLeaderboard } from '../../../redux/slices/leaderboardSlice' // Импортируем экшен
import styles from './LeaderboardShortBlock.module.css'

const LeaderboardShortBlock = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // 🚀 Читаем строго недельные данные
  const { weeklyList = [], weeklyCurrentUser, status } = useSelector(
    (state) => state.leaderboard || {},
  )

  // Всегда подтягиваем актуальный недельный топ при загрузке главной страницы
  useEffect(() => {
    dispatch(fetchLeaderboard('weekly'))
  }, [dispatch])

  const isAuth = !!weeklyCurrentUser
  const displayName = weeklyCurrentUser?.displayName || 'Вы'

  const weeklyTop3 = weeklyList.slice(0, 3) || []
  const medals = ['🥇', '🥈', '🥉']

  return (
    <section className={styles.leaderboard_section}>
      <h2 className={styles.section_title}>
        🏆 ТОП ОРАТОРОВ (НЕДЕЛЯ)
      </h2>

      <div className={styles.leaderboard_wrapper} onClick={() => navigate('/leaderboard')}>
        <ul className={styles.leaderboard_list}>
          {status === 'loading' && weeklyList.length === 0 ? (
            <li className={styles.loader_text}>Загрузка лидеров...</li>
          ) : (
            weeklyTop3.map((player, index) => (
              <li key={player.id || index} className={styles.leaderboard_item}>
                <span className={styles.rank_cell}>
                  {medals[index] || `${index + 1}.`}
                </span>
                <span className={styles.player_name}>
                  {player?.displayName}
                </span>
                <div className={styles.dot_filler}></div>
                <span className={styles.xp_value}>
                  {player?.score} XP
                </span>
              </li>
            ))
          )}
        </ul>

        <div className={styles.dashed_divider}></div>

        {isAuth ? (
          <div className={styles.user_row}>
            <span className={styles.rank_cell}>
              {weeklyCurrentUser?.rank || '—'}. 👤
            </span>
            <span className={styles.player_name}>
              {displayName}
            </span>
            <div className={styles.dot_filler}></div>
            <span className={styles.xp_value}>
              {weeklyCurrentUser?.score || 0} XP
            </span>
          </div>
        ) : (
          <div className={styles.guest_register_btn} onClick={(e) => {
            e.stopPropagation();
            navigate('/auth');
          }}>
            <span>✨ Войди, чтобы занять место в топе!</span>
            <span>→</span>
          </div>
        )}

        <div className={styles.banner_footer}>
          <span>Нажми, чтобы посмотреть весь список</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default LeaderboardShortBlock
