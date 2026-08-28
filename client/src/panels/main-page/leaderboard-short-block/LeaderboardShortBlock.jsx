// components/Dashboard/LeaderboardShortBlock.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import styles from './LeaderboardShortBlock.module.css'

const LeaderboardShortBlock = () => {
  const navigate = useNavigate()
  const { list, currentUser, status } = useSelector(
    (state) => state.leaderboard,
  )

  const { displayName = 'Гость' } = useSelector(
    (state) => state.profile?.user || {},
  )
  //   const {  userWeeklyRank = {} } = useSelector((state) => state.leaderboard || {});

  const weeklyTop3 = list.slice(0, 3) || []
  const medals = ['🥇', '🥈', '🥉']

  return (
    <section className={styles.leaderboard_section}>
      <h2 className={styles.section_title}>
        🏆 ТОП ОРАТОРОВ (НЕДЕЛЯ)
      </h2>

      <div className={styles.leaderboard_wrapper} onClick={() => navigate('leaderboard')}>
        <ul className={styles.leaderboard_list}>
          {weeklyTop3.map((player, index) => (
            <li key={player.id} className={styles.leaderboard_item}>
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
          ))}
        </ul>

        <div className={styles.dashed_divider}></div>

        {/* Строка текущего юзера с мягким выделением под стиль БЭМ */}
        <div className={styles.user_row}>
          <span className={styles.rank_cell}>
            {currentUser?.rank || '—'}. 👤
          </span>
          <span className={styles.player_name}>
            Вы ({displayName || 'Anonimus'})
          </span>
          <div className={styles.dot_filler}></div>
          <span className={styles.xp_value}>
            {currentUser?.score || 0} XP
          </span>
        </div>

        <div className={styles.banner_footer}>
          <span>Нажми, чтобы посмотреть весь список</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default LeaderboardShortBlock
