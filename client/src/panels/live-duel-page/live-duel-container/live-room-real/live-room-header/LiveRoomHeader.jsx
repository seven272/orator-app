import React from 'react'
import styles from './LiveRoomHeader.module.css'

const LiveRoomHeader = ({ currentRound, tracksCount }) => {
  const getRoundTitle = () => {
    switch (currentRound) {
      case 'speakerA':
        return '📢 Ход Спикера А (Вступительный монолог)'
      case 'speakerB':
        return '📢 Ход Спикера Б (Ответный аргумент)'
      case 'feedback':
        return '🏆 Баттл завершен. Голосование'
      default:
        return '🤝 Подготовка к баттлу'
    }
  }

  return (
    <div className={styles.header_card}>
      <span className={styles.round_badge}>{getRoundTitle()}</span>
      {currentRound !== 'feedback' && (
        <div className={styles.progress_counter}>
          Реплики: <strong>{tracksCount} из 4</strong>
        </div>
      )}
    </div>
  )
}

export default LiveRoomHeader
