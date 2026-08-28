import React from 'react'

import styles from './LeaderboardPage.module.css'

import Leaderboard from '../../components/leaderboard/Leaderboard'

const LeaderboardPage = () => {
  return (
    <div className={styles.leaderboard_page}>
      <Leaderboard />
    </div>
  )
}

export default LeaderboardPage
