import React from 'react'
import { FiClock } from 'react-icons/fi'
import styles from './LiveRoomHeader.module.css'

const LiveRoomHeader = ({ currentRound, timeLeft }) => {
  // Форматирование времени в формат ММ:СС
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Возвращает понятный текст текущего статуса дискуссии
  const getRoundTitle = () => {
    switch (currentRound) {
      case 'intro':
        return '🤝 Знакомство и подготовка'
      case 'speakerA':
        return '📢 Монолог Спикера А'
      case 'speakerB':
        return '📢 Монолог Спикера Б'
      case 'blitz':
        return '⚡ Блиц-раунд (Вопросы)'
      case 'feedback':
        return '🏆 Выставление оценок'
      default:
        return ''
    }
  }

  return (
    <div className={styles.header_card}>
      <span className={styles.round_badge}>{getRoundTitle()}</span>
      {currentRound !== 'feedback' && (
        <h1 className={styles.timer_display}>
          <FiClock className={styles.clock_icon} />
          <span>{formatTime(timeLeft)}</span>
        </h1>
      )}
    </div>
  )
}

export default LiveRoomHeader
