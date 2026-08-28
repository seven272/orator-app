import React from 'react'

import styles from './LiveDuelJoinPage.module.css'
import LiveDuelJoinHandler from './live-duel-join-handler/LiveDuelJoinHandler'

const LiveDuelJoinPage = () => {
  return (
    <div className={styles.live_duel_join_page}>
      <LiveDuelJoinHandler />
    </div>
  )
}

export default LiveDuelJoinPage
