import React from 'react'

import MiniDashboard from './mini-dashboard/MiniDashboard'
import MiniLeaderboard from './mini-leaderboard/MiniLeaderboard'
import styles from './MiniDashboardPage.module.css'

const MiniDashboardPage = () => {
  return (
    <div className={styles.mini_dashboard_page}>
      <MiniDashboard />
      <MiniLeaderboard />
    </div>
  )
}

export default MiniDashboardPage
